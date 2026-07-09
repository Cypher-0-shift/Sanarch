# app/routers/timeline.py
from fastapi import APIRouter, Depends, HTTPException, Query
from google.cloud.firestore import Client, Query as FirestoreQuery
from app.firestore import get_db
from app.middleware.auth_middleware import get_current_user
from app.schemas.medical_event import MedicalEventListResponse, MedicalEventResponse
from app.logging_config import logger
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
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns the chronological medical timeline for a patient.
    Cached in Redis for 5 minutes per patient.
    Cache invalidated when new documents complete processing.
    """
    if str(current_user["id"]) != patient_id:
        patient_snap = db.collection("patients").document(patient_id).get()
        if not patient_snap.exists:
            raise HTTPException(403, "access denied")
        patient_data = patient_snap.to_dict()
        if patient_data.get("owner_id") != current_user["id"]:
            raise HTTPException(403, "access denied")

    cache_key = f"timeline:{patient_id}:{offset}:{limit}"

    try:
        r = _get_redis()
        cached = r.get(cache_key)
        if cached:
            logger.info(f"Timeline cache hit: {cache_key}")
            data = json.loads(cached)
            return MedicalEventListResponse(**data)
    except Exception as e:
        logger.warning(f"Redis cache read failed: {e} — falling through to DB")

    # Query DB
    docs_stream = db.collection("medical_events")\
        .where("patient_id", "==", patient_id)\
        .stream()

    all_events = []
    for d in docs_stream:
        data = d.to_dict()
        data["id"] = d.id
        # Convert date string to date object for pydantic if necessary, but pydantic can parse ISO strings
        all_events.append(data)

    # Sort in memory to avoid requiring a Firestore composite index
    all_events.sort(key=lambda x: x.get("event_date", ""), reverse=True)

    total = len(all_events)
    paginated = all_events[offset:offset+limit]

    result = MedicalEventListResponse(
        events=[MedicalEventResponse(**e) for e in paginated],
        items=[MedicalEventResponse(**e) for e in paginated],
        total=total,
    )

    try:
        r = _get_redis()
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