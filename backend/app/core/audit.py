from sqlalchemy import Column, String, DateTime, text, BigInteger, text
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    actor_id = Column(UUID(as_uuid=True), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100))
    resource_id = Column(UUID(as_uuid=True))
    patient_id = Column(UUID(as_uuid=True))
    ip_address = Column(INET)
    metadata_ = Column("metadata", JSONB)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
