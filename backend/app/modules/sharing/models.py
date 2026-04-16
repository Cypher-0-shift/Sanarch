import uuid
from sqlalchemy import Column, String, Boolean, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class SharingToken(Base):
    __tablename__ = "sharing_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    token = Column(String(128), unique=True, nullable=False, index=True)
    scope = Column(JSONB, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True))
    single_use = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
