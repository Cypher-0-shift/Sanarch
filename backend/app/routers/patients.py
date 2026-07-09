from fastapi import APIRouter, HTTPException, Depends
from google.cloud.firestore import Client, SERVER_TIMESTAMP
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime
import re
from app.firestore import get_db
from app.middleware.auth_middleware import get_current_user
from app.utils.sanarch_id import generate_serial, build_sanarch_id
from app.utils import sanitize_string
from app.logging_config import logger

router = APIRouter(
    prefix="/patients",
    tags=["patients"],
)

class PatientCreateRequest(BaseModel):
    full_name: str
    date_of_birth: Optional[str] = None
    relationship_to_owner: str

    @field_validator("full_name", mode="before")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if isinstance(v, str):
            v = sanitize_string(v)
        v = str(v).strip()
        if not (2 <= len(v) <= 100):
            raise ValueError("full_name must be between 2 and 100 characters")
        if re.search(r'[<>"\'`]', v):
            raise ValueError("full_name contains invalid HTML characters")
        return v

    @field_validator("relationship_to_owner")
    @classmethod
    def validate_relationship(cls, v: str) -> str:
        v = v.strip().lower()
        allowed = {"self", "spouse", "child", "parent", "sibling", "other"}
        if v not in allowed:
            raise ValueError(f"relationship_to_owner must be one of: {', '.join(allowed)}")
        return v

class PatientResponse(BaseModel):
    id: str
    sanarch_id: str
    owner_id: str
    full_name: str
    date_of_birth: Optional[str] = None
    relationship_to_owner: str
    created_at: datetime

    class Config:
        from_attributes = True

class PatientsListResponse(BaseModel):
    patients: List[PatientResponse]
    items: List[PatientResponse]
    total: int

@router.post("/create", response_model=PatientResponse, status_code=201)
def create_patient(
    request: PatientCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    age = 35 # Default
    if request.date_of_birth:
        try:
            dob = datetime.strptime(request.date_of_birth, "%Y-%m-%d").date()
            today = datetime.now().date()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        except ValueError:
            pass

    sanarch_id = build_sanarch_id(
        country="IN",
        reg_year=datetime.now().year,
        gender="X", # Default if not collected here
        age=age,
        profile_type="D" if request.relationship_to_owner != "self" else "P",
        member_index=0,
        family_serial=generate_serial()
    )
    
    patient_data = {
        "owner_id": current_user["id"],
        "sanarch_id": sanarch_id,
        "full_name": request.full_name,
        "date_of_birth": request.date_of_birth,
        "relationship_to_owner": request.relationship_to_owner,
        "is_active": True,
        "created_at": SERVER_TIMESTAMP
    }
    
    _, new_ref = db.collection("patients").add(patient_data)
    patient_data["id"] = new_ref.id
    patient_data["created_at"] = datetime.now()
    
    logger.info(f"Patient created: {sanarch_id} for user {current_user['id']}")
    return patient_data

@router.get("/", response_model=PatientsListResponse)
def get_patients(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    docs = db.collection("patients").where("owner_id", "==", current_user["id"]).where("is_active", "==", True).stream()
    patients = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        patients.append(data)
        
    patients.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
    return PatientsListResponse(patients=patients, items=patients, total=len(patients))

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    doc_ref = db.collection("patients").document(patient_id)
    doc_snap = doc_ref.get()
    
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="patient not found")
        
    patient = doc_snap.to_dict()
    if patient.get("owner_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="patient not found")
        
    patient["id"] = doc_snap.id
    return patient

@router.delete("/{patient_id}")
def delete_patient(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    doc_ref = db.collection("patients").document(patient_id)
    doc_snap = doc_ref.get()
    
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="patient not found")
        
    patient = doc_snap.to_dict()
    if patient.get("owner_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="patient not found")
    
    doc_ref.update({"is_active": False})
    logger.info(f"Patient {patient_id} soft-deleted by user {current_user['id']}")
    return {"status": "deleted"}
