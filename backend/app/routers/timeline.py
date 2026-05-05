# app/routers/timeline.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.user import User
from app.models.medical_event import MedicalEvent
from app.models.patient import Patient
from app.middleware.auth_middleware import get_current_user
from app.schemas.medical_event import MedicalEventListResponse, MedicalEventResponse
from app.logging_config import logger
from typing import Optional
import redis
import json
from app.config import settings

router = APIRouter(prefix="/timeline", tags=["timeline"])

def _get_redis():
    return redis.from_url(settings.redis_url, decode_responses=True)

CACHE_TTL = 300  # 5 minutes

@router.get("/{patient_id}", response_model=MedicalEventListResponse)
def get_patient_timeline(
    patient_id: str,
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the chronological medical timeline for a patient.
    Cached in Redis for 5 minutes per patient.
    Cache invalidated when new documents complete processing.
    """
    # Verify ownership — user can only access their own patients
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.owner_id == current_user.id,
    ).first()

    # Also allow access to own timeline (patient_id == user's own record)
    if not patient:
        # Check if patient_id refers to the user themselves
        if str(current_user.id) != patient_id:
            raise HTTPException(403, "Access denied to this patient's timeline")

    cache_key = f"timeline:{patient_id}:{offset}:{limit}"
    r = _get_redis()

    # Try cache first
    try:
        cached = r.get(cache_key)
        if cached:
            logger.info(f"Timeline cache hit: {cache_key}")
            data = json.loads(cached)
            return MedicalEventListResponse(**data)
    except Exception as e:
        logger.warning(f"Redis cache read failed: {e} — falling through to DB")

    # Query DB
    query = db.query(MedicalEvent).filter(
        MedicalEvent.patient_id == patient_id
    ).order_by(desc(MedicalEvent.event_date))

    total = query.count()
    events = query.offset(offset).limit(limit).all()

    result = MedicalEventListResponse(
        events=[MedicalEventResponse.model_validate(e) for e in events],
        total=total,
    )

    # Write to cache
    try:
        r.setex(cache_key, CACHE_TTL, result.model_dump_json())
    except Exception as e:
        logger.warning(f"Redis cache write failed: {e}")

    return result

def invalidate_timeline_cache(patient_id: str) -> None:
    """Call this after a new document is confirmed for a patient."""
    try:
        r = _get_redis()
        pattern = f"timeline:{patient_id}:*"
        keys = r.keys(pattern)
        if keys:
            r.delete(*keys)
            logger.info(f"Invalidated {len(keys)} timeline cache keys for patient {patient_id}")
    except Exception as e:
        logger.warning(f"Cache invalidation failed for {patient_id}: {e}")