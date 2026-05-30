from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Date
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class MedicalEvent(Base):
    __tablename__ = "medical_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    event_date = Column(Date, nullable=False)
    hospital_name = Column(String)
    doctor_name = Column(String)
    diagnosis = Column(JSON) # list of strings
    medications = Column(JSON) # list of dicts
    lab_values = Column(JSON) # list of dicts
    summary = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", foreign_keys=[document_id])
