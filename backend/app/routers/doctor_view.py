# app/routers/doctor_view.py
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from google.cloud.firestore import Client, SERVER_TIMESTAMP
from app.firestore import get_db
from app.schemas.share_token import DoctorViewResponse, DoctorEventItem
from app.logging_config import logger
import json

router = APIRouter(prefix="/doctor-view", tags=["doctor_view"])

@router.get("/{token}", response_model=DoctorViewResponse)
def get_doctor_view(token: str, db: Client = Depends(get_db)):
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
        
    if share.get("is_revoked") or expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=404, detail="invalid or expired link")
        
    doc_ref.update({"accessed_at": SERVER_TIMESTAMP})
    
    user_snap = db.collection("users").document(share.get("owner_id")).get()
    if not user_snap.exists:
        raise HTTPException(status_code=404, detail="user not found")
        
    user = user_snap.to_dict()
        
    doctor_events = []
    
    for eid in share.get("event_ids", []):
        e_snap = db.collection("medical_events").document(eid).get()
        if not e_snap.exists:
            continue
            
        e = e_snap.to_dict()
        doc_label = None
        doc_filename = None
        doc_ai_summary = None
        
        doc_id = e.get("document_id")
        if doc_id:
            d_snap = db.collection("documents").document(doc_id).get()
            if d_snap.exists:
                doc = d_snap.to_dict()
                doc_label = doc.get("label")
                doc_filename = doc.get("original_filename")
                
                ai_summary_str = doc.get("ai_summary")
                if ai_summary_str:
                    try:
                        parsed_summary = json.loads(ai_summary_str)
                        doc_ai_summary = parsed_summary.get("summary")
                    except Exception as err:
                        logger.warning(f"Failed to parse ai_summary for doc {doc_id}: {err}")
        
        event_date = e.get("event_date")
        if isinstance(event_date, datetime):
            event_date = event_date.isoformat()
            
        doctor_events.append(
            DoctorEventItem(
                event_id=eid,
                event_date=str(event_date) if event_date else "",
                hospital_name=e.get("hospital_name"),
                doctor_name=e.get("doctor_name"),
                diagnosis=e.get("diagnosis", []),
                medications=e.get("medications", []),
                lab_values=e.get("lab_values", []),
                summary=e.get("summary"),
                ai_summary=doc_ai_summary,
                document_label=doc_label,
                document_filename=doc_filename,
            )
        )
        
    # Sort events by date descending
    doctor_events.sort(key=lambda x: x.event_date, reverse=True)
        
    accessed_at = share.get("accessed_at")
    if isinstance(accessed_at, str):
        accessed_at = datetime.fromisoformat(accessed_at)
        
    return DoctorViewResponse(
        patient_sanarch_id=user.get("sanarch_id", "UNKNOWN"),
        patient_name=user.get("full_name"),
        accessed_at=accessed_at or datetime.now(timezone.utc),
        expires_at=expires_at,
        token_valid=True,
        events=doctor_events,
        total_events=len(doctor_events)
    )
