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

    # Query DB for medical events
    docs_stream = db.collection("medical_events")\
        .where("patient_id", "==", patient_id)\
        .stream()

    all_events = []
    seen_doc_ids = set()

    for d in docs_stream:
        data = d.to_dict()
        data["id"] = d.id
        doc_id = data.get("document_id") or d.id
        seen_doc_ids.add(doc_id)

        # Normalize event_date to string
        raw_date = data.get("event_date") or data.get("date_start") or data.get("created_at")
        date_str = None
        if raw_date:
            if hasattr(raw_date, "strftime"):
                date_str = raw_date.strftime("%Y-%m-%d")
            elif hasattr(raw_date, "isoformat"):
                date_str = raw_date.isoformat()[:10]
            else:
                date_str = str(raw_date)[:10]

        created_at_val = data.get("created_at")
        if created_at_val and hasattr(created_at_val, "isoformat"):
            created_at_str = created_at_val.isoformat()
        elif created_at_val:
            created_at_str = str(created_at_val)
        else:
            created_at_str = None

        diagnosis_list = data.get("diagnosis") or []
        summary_text = data.get("summary") or ""
        hospital_name = data.get("hospital_name") or data.get("hospital")
        doctor_name = data.get("doctor_name") or data.get("doctor")

        condition_name = (
            data.get("condition")
            or (diagnosis_list[0] if diagnosis_list else None)
            or (summary_text[:50] if summary_text else None)
            or hospital_name
            or "Medical Record"
        )

        data["event_date"] = date_str
        data["date_start"] = date_str
        data["hospital_name"] = hospital_name
        data["hospital"] = hospital_name
        data["doctor_name"] = doctor_name
        data["doctor"] = doctor_name
        data["condition"] = condition_name
        data["document_id"] = doc_id
        data["document_count"] = data.get("document_count") or 1
        data["label"] = data.get("label") or "hospital_summary"
        data["created_at"] = created_at_str

        all_events.append(data)

    # Also check ready documents for this patient/owner as fallback
    try:
        doc_query = db.collection("documents")\
            .where("patient_id", "==", patient_id)\
            .where("status", "==", "ready")\
            .stream()
        for doc_snap in doc_query:
            if doc_snap.id in seen_doc_ids:
                continue
            doc_data = doc_snap.to_dict()
            extracted = doc_data.get("extracted_data") or {}
            raw_date = extracted.get("document_date") or doc_data.get("created_at")
            date_str = None
            if raw_date:
                if hasattr(raw_date, "strftime"):
                    date_str = raw_date.strftime("%Y-%m-%d")
                elif hasattr(raw_date, "isoformat"):
                    date_str = raw_date.isoformat()[:10]
                else:
                    date_str = str(raw_date)[:10]

            created_at_val = doc_data.get("created_at")
            created_at_str = created_at_val.isoformat() if hasattr(created_at_val, "isoformat") else (str(created_at_val) if created_at_val else None)
            h_name = extracted.get("hospital_name")
            d_name = extracted.get("doctor_name")
            diag = extracted.get("diagnosis") or []
            summ = doc_data.get("summary") or extracted.get("summary") or ""
            cond = doc_data.get("document_title") or (diag[0] if diag else None) or (summ[:50] if summ else None) or h_name or "Medical Record"
            
            all_events.append({
                "id": doc_snap.id,
                "patient_id": patient_id,
                "document_id": doc_snap.id,
                "event_date": date_str,
                "date_start": date_str,
                "hospital_name": h_name,
                "hospital": h_name,
                "doctor_name": d_name,
                "doctor": d_name,
                "condition": cond,
                "diagnosis": diag,
                "medications": extracted.get("medications") or [],
                "lab_values": extracted.get("lab_values") or [],
                "summary": summ,
                "label": doc_data.get("document_label") or "hospital_summary",
                "document_count": 1,
                "created_at": created_at_str,
            })
            seen_doc_ids.add(doc_snap.id)
    except Exception as doc_fallback_err:
        logger.warning(f"Document fallback stream failed (non-fatal): {doc_fallback_err}")

    # Sort safely in memory by date descending
    all_events.sort(
        key=lambda x: str(x.get("event_date") or x.get("date_start") or x.get("created_at") or ""),
        reverse=True
    )

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