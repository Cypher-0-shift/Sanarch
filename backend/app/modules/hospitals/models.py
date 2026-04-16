import uuid
from sqlalchemy import Column, String, Boolean, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(300), nullable=False)
    registration_no = Column(String(100), unique=True, nullable=False)
    address = Column(JSONB, nullable=False)
    phone = Column(String(15))
    email = Column(String(200))
    api_client_id = Column(String(100), unique=True, nullable=False)
    api_client_secret_hash = Column(String(256), nullable=False)
    is_active = Column(Boolean, default=True)
    onboarded_at = Column(DateTime(timezone=True), server_default=text("now()"))
    metadata_ = Column("metadata", JSONB, default={})

class HospitalStaff(Base):
    __tablename__ = "hospital_staff"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=False)
    full_name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(50), nullable=False, default='staff')
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

    hospital = relationship("Hospital")
