import uuid
from sqlalchemy import Column, String, Boolean, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=False, index=True)
    full_name = Column(String(200), nullable=False)
    phone = Column(String(15), unique=True, nullable=False)
    email = Column(String(200))
    specialization = Column(String(150))
    registration_no = Column(String(100))
    password_hash = Column(String(256), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

    hospital = relationship("Hospital")
