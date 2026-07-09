# app/routers/search.py
from fastapi import APIRouter, Depends, Query
from google.cloud.firestore import Client
from app.firestore import get_db
from app.middleware.auth_middleware import get_current_user
from app.logging_config import logger
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/search", tags=["search"])

class SearchResult(BaseModel):
    id: str
    type: str  # "document" or "event"
    title: str
    subtitle: Optional[str] = None
    date: Optional[str] = None
    label: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[SearchResult]
    items: List[SearchResult]
    total: int
    query: str

@router.get("/", response_model=SearchResponse)
def search_records(
    q: str = Query(..., min_length=3, max_length=100),
    limit: int = Query(default=20, le=50),
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Search across documents and medical events owned by the user.
    Since Firestore doesn't support full text search natively, we filter in memory 
    for the specific user's records.
    """
    q = q.strip().lower()
    if len(q) < 3:
        return SearchResponse(results=[], items=[], total=0, query=q)

    results = []

    # 1. Fetch user's documents
    docs_stream = db.collection("documents")\
        .where("owner_id", "==", current_user["id"])\
        .where("status", "==", "complete")\
        .stream()

    patient_ids = set()
    
    for doc in docs_stream:
        data = doc.to_dict()
        data["id"] = doc.id
        if data.get("patient_id"):
            patient_ids.add(data["patient_id"])
            
        filename = (data.get("original_filename") or "").lower()
        label = (data.get("label") or "").lower()
        
        if q in filename or q in label:
            uploaded_at = data.get("uploaded_at")
            date_str = None
            if uploaded_at:
                try:
                    date_str = uploaded_at.date().isoformat() if hasattr(uploaded_at, "date") else str(uploaded_at)
                except:
                    pass
                    
            results.append(SearchResult(
                id=doc.id,
                type="document",
                title=data.get("original_filename") or "Untitled Document",
                subtitle=data.get("label"),
                date=date_str,
                label=data.get("label"),
            ))

    # 2. Fetch medical events for all those patients
    events_found = 0
    if len(results) < limit and patient_ids:
        # Firestore 'in' query has max 10 elements. We might need to query per patient.
        for pid in list(patient_ids):
            if events_found + len(results) >= limit:
                break
                
            events_stream = db.collection("medical_events")\
                .where("patient_id", "==", pid)\
                .stream()
                
            for event in events_stream:
                e_data = event.to_dict()
                
                hospital = (e_data.get("hospital_name") or "").lower()
                doctor = (e_data.get("doctor_name") or "").lower()
                summary = (e_data.get("summary") or "").lower()
                
                if q in hospital or q in doctor or q in summary:
                    results.append(SearchResult(
                        id=event.id,
                        type="event",
                        title=e_data.get("hospital_name") or "Medical Event",
                        subtitle=e_data.get("doctor_name"),
                        date=e_data.get("event_date")
                    ))
                    events_found += 1
                    
                if events_found + len(results) >= limit:
                    break

    # Sort results
    results = results[:limit]

    logger.info(f"Search '{q}' returned {len(results)} results for user {current_user['id']}")
    return SearchResponse(results=results, items=results, total=len(results), query=q)