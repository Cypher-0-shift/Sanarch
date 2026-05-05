# app/schemas/document.py
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

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