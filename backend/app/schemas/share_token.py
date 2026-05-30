# app/schemas/share_token.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class GenerateTokenRequest(BaseModel):
    event_ids: List[str]
    doctor_name: Optional[str] = None

class ShareTokenResponse(BaseModel):
    token: str
    expires_at: datetime
    qr_payload: str

class DoctorEventItem(BaseModel):
    event_id: str
    event_date: str
    hospital_name: Optional[str]
    doctor_name: Optional[str]
    diagnosis: List[str]
    medications: List[dict]
    lab_values: List[dict]
    summary: Optional[str]           # extracted summary from MedicalEvent
    ai_summary: Optional[str]        # Claude-generated plain English summary (if generated)
    document_label: Optional[str]    # Lab Report, Prescription, etc.
    document_filename: Optional[str]

class DoctorViewResponse(BaseModel):
    patient_sanarch_id: str
    patient_name: Optional[str]
    accessed_at: datetime
    expires_at: datetime
    token_valid: bool
    events: List[DoctorEventItem]
    total_events: int