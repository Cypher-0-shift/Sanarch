from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import re
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
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
    id: UUID
    sanarch_id: str
    owner_id: UUID
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
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
    
    patient = Patient(
        owner_id=current_user.id,
        sanarch_id=sanarch_id,
        full_name=request.full_name,
        date_of_birth=request.date_of_birth,
        relationship_to_owner=request.relationship_to_owner
    )
    
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    logger.info(f"Patient created: {patient.sanarch_id} for user {current_user.id}")
    return patient

@router.get("/", response_model=PatientsListResponse)
def get_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patients = db.query(Patient).filter(Patient.owner_id == current_user.id, Patient.is_active).order_by(Patient.created_at.desc()).all()
    return PatientsListResponse(patients=patients, items=patients, total=len(patients))

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        pid = UUID(patient_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid patient id format")

    patient = db.query(Patient).filter(Patient.id == pid, Patient.owner_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="patient not found")
    return patient

@router.delete("/{patient_id}")
def delete_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        pid = UUID(patient_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid patient id format")

    patient = db.query(Patient).filter(Patient.id == pid, Patient.owner_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="patient not found")
    
    patient.is_active = False
    db.commit()
    logger.info(f"Patient {patient_id} soft-deleted by user {current_user.id}")
    return {"status": "deleted"}
