from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import Optional
import json
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_patient
from app.modules.patients.models import Patient
from app.modules.records.models import MedicalRecord, LabResult, Prescription, DischargeSummary, FollowUp
from app.core.redis import redis_client
from pydantic import BaseModel

router = APIRouter()

class UpdatePatientProfile(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None

@router.get("/me")
async def get_my_profile(current_patient: dict = Depends(get_current_patient), db: AsyncSession = Depends(get_db)):
    stmt = select(Patient).where(Patient.id == current_patient["id"])
    result = await db.execute(stmt)
    patient = result.scalars().first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
        
    return patient

@router.patch("/me")
async def update_my_profile(req: UpdatePatientProfile, current_patient: dict = Depends(get_current_patient), db: AsyncSession = Depends(get_db)):
    stmt = select(Patient).where(Patient.id == current_patient["id"])
    result = await db.execute(stmt)
    patient = result.scalars().first()
    
    if req.full_name is not None:
        patient.full_name = req.full_name
    if req.gender is not None:
        patient.gender = req.gender
    if req.blood_group is not None:
        patient.blood_group = req.blood_group
        
    await db.commit()
    await db.refresh(patient)
    return patient

@router.get("/me/timeline")
async def get_my_timeline(
    type: Optional[str] = None,
    hospital_id: Optional[str] = None,
    current_patient: dict = Depends(get_current_patient), 
    db: AsyncSession = Depends(get_db)
):
    # 1. Check Redis cache first
    cache_key = f"timeline:{current_patient['id']}:{type}:{hospital_id}"
    cached_data = await redis_client.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)

    # 2. On miss: Query PostgreSQL records
    stmt = select(MedicalRecord).where(MedicalRecord.patient_id == current_patient["id"])
    
    if type:
        stmt = stmt.where(MedicalRecord.record_type == type)
    if hospital_id:
        stmt = stmt.where(MedicalRecord.hospital_id == hospital_id)
        
    stmt = stmt.order_by(MedicalRecord.record_date.desc())
    
    # We'll just load the base records to preserve performance. 
    # For full functionality, we would query specific tables or use joinedload based on type.
    result = await db.execute(stmt)
    records = result.scalars().all()
    
    # 3. Format Response
    timeline = []
    for r in records:
        # Pre-signed S3 URLs logic goes here for file_key if present
        timeline.append({
            "id": str(r.id),
            "record_type": r.record_type,
            "record_date": r.record_date.isoformat(),
            "title": r.title,
            "hospital_id": str(r.hospital_id),
            "file_key": r.file_key,
            "is_verified": r.is_verified
        })
        
    # 4. Cache the result for 5 minutes (300 seconds)
    await redis_client.setex(cache_key, 300, json.dumps(timeline))
    
    return timeline
