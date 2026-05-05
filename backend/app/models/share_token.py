# app/models/share_token.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database import Base

class ShareToken(Base):
    __tablename__ = "share_tokens"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token = Column(String, unique=True, nullable=False, index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    event_ids = Column(JSON, nullable=False)  # list of medical_event UUIDs
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)
    doctor_name = Column(String, nullable=True)
    accessed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))