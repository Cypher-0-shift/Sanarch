from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sanarch_id = Column(String, unique=True, nullable=False)
    phone_number = Column(String, unique=True, nullable=False)
    firebase_uid = Column(String, unique=True, nullable=False)
    full_name = Column(String)
    email = Column(String)
    date_of_birth = Column(String)
    height_cm = Column(String)
    weight_kg = Column(String)
    profile_photo_url = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    patients = relationship("Patient", back_populates="owner")
    documents = relationship("Document", back_populates="owner")
