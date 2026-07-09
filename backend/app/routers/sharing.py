# app/routers/sharing.py
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from google.cloud.firestore import Client, SERVER_TIMESTAMP, Query
from app.firestore import get_db
from app.middleware.auth_middleware import get_current_user
from app.schemas.share_token import GenerateTokenRequest, ShareTokenResponse
from app.logging_config import logger
from pydantic import BaseModel
from typing import List

class ShareAccessResponse(BaseModel):
    sanarch_id: str
    accessed_at: datetime | None = None
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
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if not body.event_ids:
        raise HTTPException(400, "at least one event_id required")

    MAX_ACTIVE_TOKENS_PER_USER = 10
    now = datetime.now(timezone.utc)
    
    # Firestore composite query requiring an index (owner_id, is_revoked, expires_at)
    active_tokens = list(
        db.collection("share_tokens")
        .where("owner_id", "==", current_user["id"])
        .where("is_revoked", "==", False)
        .where("expires_at", ">", now)
        .stream()
    )
    
    if len(active_tokens) >= MAX_ACTIVE_TOKENS_PER_USER:
        raise HTTPException(429, "maximum active share tokens reached")

    token = secrets.token_urlsafe(32)
    expires_at = now + timedelta(minutes=TOKEN_TTL_MINUTES)

    share_data = {
        "token": token,
        "owner_id": current_user["id"],
        "event_ids": body.event_ids,
        "expires_at": expires_at,
        "doctor_name": body.doctor_name,
        "is_revoked": False,
        "created_at": SERVER_TIMESTAMP
    }
    
    db.collection("share_tokens").document(token).set(share_data)

    qr_payload = f"sanarch://share/{token}"
    logger.info(f"Share token created: {token[:8]}... for user {current_user['id']}")

    return ShareTokenResponse(token=token, expires_at=expires_at, qr_payload=qr_payload)

@router.post("/revoke/{token}")
def revoke_token(
    token: str,
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    doc_ref = db.collection("share_tokens").document(token)
    doc_snap = doc_ref.get()
    
    if not doc_snap.exists:
        raise HTTPException(404, "token not found")
        
    share_data = doc_snap.to_dict()
    if share_data.get("owner_id") != current_user["id"]:
        raise HTTPException(404, "token not found")
        
    doc_ref.update({"is_revoked": True})
    return {"status": "revoked"}

@router.get("/access/{token}", response_model=ShareAccessResponse)
@limiter.limit("30/minute")
def access_shared_events(token: str, request: Request, db: Client = Depends(get_db)):
    if len(token) < 32 or len(token) > 64:
        raise HTTPException(400, "invalid token format")

    doc_ref = db.collection("share_tokens").document(token)
    doc_snap = doc_ref.get()
    
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="invalid or expired link")
        
    share = doc_snap.to_dict()
    
    expires_at = share.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
        
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if share.get("is_revoked", False) or expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=404, detail="invalid or expired link")
        
    doc_ref.update({"accessed_at": SERVER_TIMESTAMP})
    
    events_data = []
    for eid in share.get("event_ids", []):
        e_snap = db.collection("medical_events").document(eid).get()
        if e_snap.exists:
            e = e_snap.to_dict()
            events_data.append({
                "event_date": e.get("event_date"),
                "hospital_name": e.get("hospital_name"),
                "doctor_name": e.get("doctor_name"),
                "diagnosis": e.get("diagnosis", []),
                "medications": e.get("medications", []),
                "lab_values": e.get("lab_values", []),
                "summary": e.get("summary")
            })
            
    user_snap = db.collection("users").document(share.get("owner_id")).get()
    sanarch_id = user_snap.to_dict().get("sanarch_id", "UNKNOWN") if user_snap.exists else "UNKNOWN"
    
    logger.info(f"Share token {token[:8]}... accessed")
    
    accessed_at = share.get("accessed_at")
    if isinstance(accessed_at, str):
        accessed_at = datetime.fromisoformat(accessed_at)
        
    return ShareAccessResponse(
        sanarch_id=sanarch_id,
        accessed_at=accessed_at or datetime.now(timezone.utc),
        expires_at=expires_at,
        events=events_data
    )