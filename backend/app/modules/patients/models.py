import uuid
from sqlalchemy import Column, String, Boolean, Date, DateTime, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    phone_verified = Column(Boolean, default=False)
    full_name = Column(String(200), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(10))
    blood_group = Column(String(5))
    emergency_contact = Column(JSONB)
    profile_complete = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), onupdate=text("now()"))
    is_active = Column(Boolean, default=True)
