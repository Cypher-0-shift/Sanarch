import uuid
from sqlalchemy import Column, String, Boolean, Date, DateTime, text, ForeignKey, Numeric, Integer, Time
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=False, index=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("hospital_staff.id"), nullable=False)
    record_type = Column(String(50), nullable=False)
    record_date = Column(Date, nullable=False)
    title = Column(String(300))
    notes = Column(String)
    external_ref = Column(String(200))
    file_key = Column(String(500))
    file_mime_type = Column(String(100))
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), onupdate=text("now()"))

class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id = Column(UUID(as_uuid=True), ForeignKey("medical_records.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    test_name = Column(String(200), nullable=False)
    test_category = Column(String(100))
    result_value = Column(Numeric)
    result_text = Column(String(500))
    unit = Column(String(50))
    reference_min = Column(Numeric)
    reference_max = Column(Numeric)
    reference_text = Column(String(200))
    is_abnormal = Column(Boolean)
    test_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id = Column(UUID(as_uuid=True), ForeignKey("medical_records.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_name = Column(String(200))
    diagnosis_label = Column(String(300))
    issued_date = Column(Date, nullable=False)
    valid_until = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prescription_id = Column(UUID(as_uuid=True), ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False)
    drug_name = Column(String(200), nullable=False)
    dosage = Column(String(100))
    frequency = Column(String(100))
    route = Column(String(50))
    duration_days = Column(Integer)
    instructions = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

class DischargeSummary(Base):
    __tablename__ = "discharge_summaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id = Column(UUID(as_uuid=True), ForeignKey("medical_records.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    admission_date = Column(Date, nullable=False)
    discharge_date = Column(Date, nullable=False)
    ward = Column(String(100))
    attending_doctor = Column(String(200))
    admission_reason = Column(String)
    treatment_summary = Column(String)
    discharge_instructions = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id = Column(UUID(as_uuid=True), ForeignKey("medical_records.id"))
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"))
    scheduled_date = Column(Date, nullable=False)
    scheduled_time = Column(Time)
    reason = Column(String)
    status = Column(String(30), default='scheduled')
    rescheduled_to = Column(Date)
    reminder_sent = Column(Boolean, default=False)
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), onupdate=text("now()"))
