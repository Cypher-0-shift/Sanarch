from fastapi import APIRouter, HTTPException, Depends
from google.cloud.firestore import Client, SERVER_TIMESTAMP
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import re
from app.firestore import get_db
from app.middleware.auth_middleware import get_current_user
from app.utils.sanarch_id import generate_serial, build_sanarch_id, parse_sanarch_id
from app.utils import sanitize_string
from app.logging_config import logger

router = APIRouter(
    prefix="/patients",
    tags=["patients"],
)

class PatientCreateRequest(BaseModel):
    full_name: Optional[str] = None
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    relationship_to_owner: Optional[str] = None
    relation: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    height_cm: Optional[str] = None
    weight_kg: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    sanarch_id: str
    owner_id: str
    full_name: str
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    relationship_to_owner: str
    relation: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    height_cm: Optional[str] = None
    weight_kg: Optional[str] = None
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
    raw_name = request.full_name or request.name or ""
    if not raw_name.strip():
        raise HTTPException(status_code=400, detail="full_name is required")
    full_name = sanitize_string(raw_name.strip())

    raw_rel = request.relationship_to_owner or request.relation or "other"
    relationship_to_owner = raw_rel.strip().lower()
    allowed_rels = {"self", "spouse", "child", "parent", "sibling", "other"}
    if relationship_to_owner not in allowed_rels:
        relationship_to_owner = "other"

    age = 30 # Default
    if request.date_of_birth:
        try:
            dob = datetime.strptime(request.date_of_birth, "%Y-%m-%d").date()
            today = datetime.now().date()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        except ValueError:
            pass

    # Inherit family serial from primary account
    user_sanarch_id = current_user.get("sanarch_id")
    family_serial = None
    if user_sanarch_id:
        try:
            parsed = parse_sanarch_id(user_sanarch_id)
            family_serial = parsed.get("family_serial")
        except Exception:
            pass

    if not family_serial:
        family_serial = current_user.get("family_serial") or generate_serial()

    # Count existing dependents to calculate member index
    existing_docs = list(db.collection("patients").where("owner_id", "==", current_user["id"]).where("is_active", "==", True).stream())
    member_index = len(existing_docs) + 1 if relationship_to_owner != "self" else 0

    gender_char = "X"
    if request.gender:
        g = request.gender.upper().strip()
        gender_char = g[0] if g[0] in ("M", "F", "X") else "X"

    sanarch_id = build_sanarch_id(
        country="IN",
        reg_year=datetime.now().year,
        gender=gender_char,
        age=max(0, age),
        profile_type="D" if relationship_to_owner != "self" else "P",
        member_index=member_index,
        family_serial=family_serial
    )
    
    patient_data = {
        "owner_id": current_user["id"],
        "sanarch_id": sanarch_id,
        "full_name": full_name,
        "name": full_name,
        "date_of_birth": request.date_of_birth,
        "relationship_to_owner": relationship_to_owner,
        "relation": relationship_to_owner,
        "gender": request.gender,
        "blood_group": request.blood_group,
        "height_cm": request.height_cm,
        "weight_kg": request.weight_kg,
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
        if "name" not in data:
            data["name"] = data.get("full_name", "")
        if "relation" not in data:
            data["relation"] = data.get("relationship_to_owner", "other")
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
    if "name" not in patient:
        patient["name"] = patient.get("full_name", "")
    if "relation" not in patient:
        patient["relation"] = patient.get("relationship_to_owner", "other")
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
