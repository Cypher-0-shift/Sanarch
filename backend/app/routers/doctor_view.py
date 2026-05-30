# app/routers/doctor_view.py
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.share_token import ShareToken
from app.models.medical_event import MedicalEvent
from app.models.document import Document
from app.schemas.share_token import DoctorViewResponse, DoctorEventItem
from app.logging_config import logger
import json

router = APIRouter(prefix="/doctor-view", tags=["doctor_view"])

@router.get("/{token}", response_model=DoctorViewResponse)
def get_doctor_view(token: str, db: Session = Depends(get_db)):
    share = db.query(ShareToken).filter(ShareToken.token == token).first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Invalid or expired link")
        
    expires_at = share.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if share.is_revoked or expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=404, detail="Invalid or expired link")
        
    share.accessed_at = datetime.now(timezone.utc)
    db.commit()
    
    user = db.query(User).filter(User.id == share.owner_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    events = db.query(MedicalEvent).filter(MedicalEvent.id.in_(share.event_ids)).order_by(MedicalEvent.event_date.desc()).all()
    
    doctor_events = []
    for e in events:
        doc_label = None
        doc_filename = None
        doc_ai_summary = None
        
        if e.document_id:
            doc = db.query(Document).filter(Document.id == e.document_id).first()
            if doc:
                doc_label = doc.label
                doc_filename = doc.original_filename
                
                if doc.ai_summary:
                    try:
                        # doc.ai_summary is a JSON string of AISummaryResponse
                        parsed_summary = json.loads(doc.ai_summary)
                        # We just want the plain english summary from it
                        doc_ai_summary = parsed_summary.get("summary")
                    except Exception as err:
                        logger.warning(f"Failed to parse ai_summary for doc {doc.id}: {err}")
        
        doctor_events.append(
            DoctorEventItem(
                event_id=str(e.id),
                event_date=e.event_date.isoformat() if hasattr(e.event_date, "isoformat") else str(e.event_date),
                hospital_name=e.hospital_name,
                doctor_name=e.doctor_name,
                diagnosis=e.diagnosis or [],
                medications=e.medications or [],
                lab_values=e.lab_values or [],
                summary=e.summary,
                ai_summary=doc_ai_summary,
                document_label=doc_label,
                document_filename=doc_filename,
            )
        )
        
    return DoctorViewResponse(
        patient_sanarch_id=user.sanarch_id or "UNKNOWN",
        patient_name=user.full_name,
        accessed_at=share.accessed_at,
        expires_at=share.expires_at,
        token_valid=True,
        events=doctor_events,
        total_events=len(doctor_events)
    )
