from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid, enum
from datetime import datetime, timezone
from app.database import Base

class DocumentStatus(str, enum.Enum):
    uploading = "uploading"
    scanning = "scanning"
    extracting = "extracting"
    pending_review = "pending_review"
    complete = "complete"
    failed = "failed"

class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=True)
    original_filename = Column(String)
    s3_key = Column(String)               # final encrypted path
    s3_tmp_key = Column(String)           # tmp path before scan passes
    mime_type = Column(String)
    label = Column(String)                # Lab Report, Prescription, etc.
    status = Column(Enum(DocumentStatus), default=DocumentStatus.uploading)
    extracted_data = Column(JSON)         # structured NER output
    ai_summary = Column(String, nullable=True)  # Magic summary
    page_count = Column(String)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    owner = relationship("User", back_populates="documents")
    patient = relationship("Patient", foreign_keys=[patient_id])
