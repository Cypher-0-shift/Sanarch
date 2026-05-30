# app/routers/sharing.py
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.share_token import ShareToken
from app.middleware.auth_middleware import get_current_user
from app.schemas.share_token import GenerateTokenRequest, ShareTokenResponse
from app.logging_config import logger
from pydantic import BaseModel
from typing import List
from app.models.medical_event import MedicalEvent

class ShareAccessResponse(BaseModel):
    sanarch_id: str
    accessed_at: datetime
    expires_at: datetime
    events: List[dict]

router = APIRouter(prefix="/sharing", tags=["sharing"])
limiter = Limiter(key_func=get_remote_address)

TOKEN_TTL_MINUTES = 10

@router.post("/generate-token", response_model=ShareTokenResponse, status_code=201)
@limiter.limit("20/minute")
def generate_token(
    request: Request,
    body: GenerateTokenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.event_ids:
        raise HTTPException(400, "at least one event_id required")

    MAX_ACTIVE_TOKENS_PER_USER = 10
    active_count = db.query(ShareToken).filter(
        ShareToken.owner_id == current_user.id,
        ShareToken.is_revoked == False,
        ShareToken.expires_at > datetime.now(timezone.utc),
    ).count()

    if active_count >= MAX_ACTIVE_TOKENS_PER_USER:
        raise HTTPException(429, "maximum active share tokens reached")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_TTL_MINUTES)

    share = ShareToken(
        token=token,
        owner_id=current_user.id,
        event_ids=body.event_ids,
        expires_at=expires_at,
        doctor_name=body.doctor_name,
    )
    db.add(share)
    db.commit()

    qr_payload = f"sanarch://share/{token}"
    logger.info(f"Share token created: {token[:8]}... for user {current_user.id}")

    return ShareTokenResponse(token=token, expires_at=expires_at, qr_payload=qr_payload)

@router.post("/revoke/{token}")
def revoke_token(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    share = db.query(ShareToken).filter(
        ShareToken.token == token,
        ShareToken.owner_id == current_user.id,
    ).first()
    if not share:
        raise HTTPException(404, "token not found")
    share.is_revoked = True
    db.commit()
    return {"status": "revoked"}

@router.get("/access/{token}", response_model=ShareAccessResponse)
@limiter.limit("30/minute")
def access_shared_events(token: str, request: Request, db: Session = Depends(get_db)):
    if len(token) < 32 or len(token) > 64:
        raise HTTPException(400, "invalid token format")

    share = db.query(ShareToken).filter(ShareToken.token == token).first()
    
    if not share:
        raise HTTPException(status_code=404, detail="invalid or expired link")
        
    expires_at = share.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if share.is_revoked or expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=404, detail="invalid or expired link")
        
    share.accessed_at = datetime.now(timezone.utc)
    db.commit()
    
    events = db.query(MedicalEvent).filter(MedicalEvent.id.in_(share.event_ids)).all()
    user = db.query(User).filter(User.id == share.owner_id).first()
    sanarch_id = user.sanarch_id if user else "UNKNOWN"
    
    logger.info(f"Share token {token[:8]}... accessed")
    
    events_data = []
    for e in events:
        events_data.append({
            "event_date": e.event_date.isoformat() if hasattr(e.event_date, "isoformat") else e.event_date,
            "hospital_name": e.hospital_name,
            "doctor_name": e.doctor_name,
            "diagnosis": e.diagnosis,
            "medications": e.medications,
            "lab_values": e.lab_values,
            "summary": e.summary
        })
        
    return ShareAccessResponse(
        sanarch_id=sanarch_id,
        accessed_at=share.accessed_at,
        expires_at=share.expires_at,
        events=events_data
    )