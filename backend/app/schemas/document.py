# app/schemas/document.py
from pydantic import BaseModel
from typing import Optional, Any, Literal


class DocumentUploadResponse(BaseModel):
    document_id: str
    status: str
    message: str


class DocumentListItem(BaseModel):
    document_id: str
    document_title: Optional[str] = ""
    document_label: Optional[str] = ""
    status: str
    processing_progress: int = 0
    processing_stage: str = "unknown"
    file_type: Optional[str] = ""
    b2_file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    extracted_data: Optional[dict[str, Any]] = None
    condition_terms_raw: Optional[list[str]] = None
    condition_groups: Optional[list[str]] = None
    summary: Optional[str] = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class DocumentListResponse(BaseModel):
    documents: list[DocumentListItem]


class DocumentDetailResponse(BaseModel):
    document_id: str
    document_title: str
    document_label: str
    status: str
    processing_progress: int
    processing_stage: str
    file_name: str
    file_type: str
    extracted_data: dict[str, Any]
    summary: str
    b2_file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class AISummaryResponse(BaseModel):
    document_id: str
    headline: str
    summary: str
    key_points: list[str]
    flag: Literal["normal", "attention", "urgent"]
    flag_reason: Optional[str]
    cached: bool