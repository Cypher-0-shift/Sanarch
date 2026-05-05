# app/routers/search.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, cast, String
from app.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.models.medical_event import MedicalEvent
from app.middleware.auth_middleware import get_current_user
from app.logging_config import logger
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

router = APIRouter(prefix="/search", tags=["search"])

class SearchResult(BaseModel):
    id: UUID
    type: str  # "document" or "event"
    title: str
    subtitle: Optional[str] = None
    date: Optional[str] = None
    label: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
    query: str

@router.get("/", response_model=SearchResponse)
def search_records(
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(default=20, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Full-text search across documents and medical events owned by the user.
    Searches: filename, label, hospital name, doctor name, diagnosis summary.
    """
    q = q.strip()
    search_term = f"%{q}%"
    results = []

    # Search documents
    docs = db.query(Document).filter(
        Document.owner_id == current_user.id,
        Document.status == DocumentStatus.complete,
        or_(
            Document.original_filename.ilike(search_term),
            Document.label.ilike(search_term),
        )
    ).limit(limit).all()

    for doc in docs:
        results.append(SearchResult(
            id=doc.id,
            type="document",
            title=doc.original_filename or "Untitled Document",
            subtitle=doc.label,
            date=doc.uploaded_at.date().isoformat() if doc.uploaded_at else None,
            label=doc.label,
        ))

    # Search medical events
    remaining = limit - len(results)
    if remaining > 0:
        events = db.query(MedicalEvent).filter(
            MedicalEvent.patient_id.in_(
                db.query(Document.patient_id).filter(
                    Document.owner_id == current_user.id
                )
            ),
            or_(
                MedicalEvent.hospital_name.ilike(search_term),
                MedicalEvent.doctor_name.ilike(search_term),
                MedicalEvent.summary.ilike(search_term),
            )
        ).limit(remaining).all()

        for event in events:
            results.append(SearchResult(
                id=event.id,
                type="event",
                title=event.hospital_name or "Medical Event",
                subtitle=event.doctor_name,
                date=event.event_date.isoformat() if event.event_date else None,
            ))

    logger.info(f"Search '{q}' returned {len(results)} results for user {current_user.id}")
    return SearchResponse(results=results, total=len(results), query=q)