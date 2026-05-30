# app/schemas/document.py
from pydantic import BaseModel
from typing import Optional, Any, Literal

class DocumentUploadResponse(BaseModel):
    document_id: str
    status: str

class DocumentStatusResponse(BaseModel):
    document_id: str
    status: str
    extracted_data: Optional[dict[str, Any]] = None

class DocumentConfirmRequest(BaseModel):
    label: str
    extracted_data: dict[str, Any]

class AISummaryResponse(BaseModel):
    document_id: str
    headline: str
    summary: str
    key_points: list[str]
    flag: Literal["normal", "attention", "urgent"]
    flag_reason: Optional[str]
    cached: bool