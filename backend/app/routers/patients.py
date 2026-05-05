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
from app.services.sanarch_id import generate_sanarch_id
from app.logging_config import logger

router = APIRouter(
    prefix="/patients",
    tags=["patients"],
)

class PatientCreateRequest(BaseModel):
    full_name: str
    date_of_birth: Optional[str] = None
    relationship_to_owner: str

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
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
    total: int

@router.post("/create", response_model=PatientResponse)
def create_patient(
    request: PatientCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sanarch_id = generate_sanarch_id(db)
    
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
    patients = db.query(Patient).filter(Patient.owner_id == current_user.id, Patient.is_active == True).order_by(Patient.created_at.asc()).all()
    return PatientsListResponse(patients=patients, total=len(patients))

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.owner_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.delete("/{patient_id}")
def delete_patient(
    patient_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.owner_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient.is_active = False
    db.commit()
    logger.info(f"Patient {patient_id} soft-deleted by user {current_user.id}")
    return {"status": "deleted"}
