# app/schemas/medical_event.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class MedicationItem(BaseModel):
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None

class LabValueItem(BaseModel):
    test_name: str
    value: Optional[str] = None
    unit: Optional[str] = None
    flag: Optional[str] = None  # normal | high | low | null

class MedicalEventResponse(BaseModel):
    id: str
    patient_id: str
    document_id: Optional[str] = None
    event_date: date
    hospital_name: Optional[str] = None
    doctor_name: Optional[str] = None
    diagnosis: Optional[List[str]] = None
    medications: Optional[List[MedicationItem]] = None
    lab_values: Optional[List[LabValueItem]] = None
    summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MedicalEventListResponse(BaseModel):
    events: List[MedicalEventResponse]
    items: List[MedicalEventResponse]
    total: int