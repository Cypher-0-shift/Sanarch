import uuid
from sqlalchemy import Column, String, Boolean, Date, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prescription_item_id = Column(UUID(as_uuid=True), ForeignKey("prescription_items.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    times_of_day = Column(JSONB, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("medication_schedules.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    logged_at = Column(DateTime(timezone=True))
    status = Column(String(20), nullable=False)
    note = Column(String(300))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
