from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import secrets
import json
import uuid

from app.core.database import get_db
from app.core.dependencies import get_current_patient, require_role, get_current_user_token
from app.modules.sharing.models import SharingToken
from app.modules.records.models import MedicalRecord
from app.modules.doctors.models import Doctor
from app.core.redis import redis_client

router = APIRouter()

class CreateShareRequest(BaseModel):
    doctor_id: str
    scope: dict # e.g. {"type": "all"} or {"record_ids": ["uuid..."]}
    ttl_seconds: int = 86400  # Default 24 hours
    single_use: bool = False

@router.post("")
async def create_share_token(
    req: CreateShareRequest,
    current_patient: dict = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db)
):
    # 1. Validate Doctor exists
    stmt = select(Doctor).where(Doctor.id == req.doctor_id)
    doc_res = await db.execute(stmt)
    doctor = doc_res.scalars().first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    # 2. Generate cryptographically safe token
    token_string = secrets.token_urlsafe(64)
    expires_at = datetime.utcnow() + timedelta(seconds=req.ttl_seconds)
    
    # 3. Store in PostgreSQL
    new_share = SharingToken(
        patient_id=current_patient["id"],
        doctor_id=req.doctor_id,
        token=token_string,
        scope=req.scope,
        expires_at=expires_at,
        single_use=req.single_use
    )
    db.add(new_share)
    await db.commit()
    await db.refresh(new_share)
    
    # 4. Mirror minimal revocation check in Redis
    # Redis key: share:{token} -> value: share_id
    await redis_client.setex(f"share:{token_string}", req.ttl_seconds, str(new_share.id))
    
    # Option: Notify doctor via push/email using Celery task here
    
    return {
        "message": "Share token active",
        "share_id": str(new_share.id),
        "token": token_string,
        "expires_at": expires_at.isoformat()
    }

@router.delete("/{share_id}")
async def revoke_share(
    share_id: str,
    current_patient: dict = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve from DB
    stmt = select(SharingToken).where(
        SharingToken.id == share_id,
        SharingToken.patient_id == current_patient["id"]
    )
    res = await db.execute(stmt)
    share = res.scalars().first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Share token not found or unauthorized")
        
    # Update DB
    share.revoked_at = datetime.utcnow()
    await db.commit()
    
    # Delete from Redis for instantaneous revocation
    await redis_client.delete(f"share:{share.token}")
    
    return {"message": "Share successfully revoked"}

@router.get("/{token}/records")
async def access_shared_records(
    token: str,
    doctor_payload: dict = Depends(require_role(["doctor"])),
    db: AsyncSession = Depends(get_db)
):
    # 1. Very fast cache check
    cached_share_id = await redis_client.get(f"share:{token}")
    if not cached_share_id:
        raise HTTPException(status_code=401, detail="Token is expired, revoked, or non-existent")
        
    # 2. Database full validation
    stmt = select(SharingToken).where(SharingToken.token == token)
    res = await db.execute(stmt)
    share = res.scalars().first()
    
    if not share:
         raise HTTPException(status_code=401, detail="Invalid token")
    if share.revoked_at:
         raise HTTPException(status_code=401, detail="Token was revoked")
    if share.expires_at < datetime.utcnow().astimezone():
         raise HTTPException(status_code=401, detail="Token has expired")
         
    # 3. Ensure this token belongs to the calling Doctor
    # For Phase 3/5 mock: checking doctor ID match
    current_doc_id = doctor_payload.get("sub")
    if str(share.doctor_id) != current_doc_id:
         raise HTTPException(status_code=403, detail="Token is not assigned to you")
         
    # 4. Filter Scope and Queries
    records_query = select(MedicalRecord).where(MedicalRecord.patient_id == share.patient_id)
    
    scope_type = share.scope.get("type", "all")
    if scope_type != "all":
        # Specific record IDs
        allowed_ids = share.scope.get("record_ids", [])
        if not allowed_ids:
            return []
        records_query = records_query.where(MedicalRecord.id.in_(allowed_ids))
        
    records_res = await db.execute(records_query)
    records = records_res.scalars().all()
    
    # 5. Revoke immediately if single_use
    if share.single_use:
        share.revoked_at = datetime.utcnow()
        await db.commit()
        await redis_client.delete(f"share:{token}")
        
    # Note: In production we would write an access log to the `audit_log` table here.

    payload = []
    for r in records:
        payload.append({
            "id": str(r.id),
            "record_type": r.record_type,
            "record_date": r.record_date.isoformat(),
            "title": r.title
        })
        
    return payload
