# app/models/profile.py
"""
SQLAlchemy model for the sanarch_profiles table.

Stores structured SANARCH ID records with family linking via shared serial.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    SmallInteger,
    DateTime,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class SanarchProfile(Base):
    __tablename__ = "sanarch_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sanarch_id = Column(String(32), unique=True, nullable=False, index=True)
    family_serial = Column(String(6), nullable=False)
    profile_type = Column(String(1), nullable=False)  # 'P' or 'D'
    member_index = Column(SmallInteger, nullable=False, default=0)
    country_code = Column(String(2), nullable=False)
    reg_year = Column(SmallInteger, nullable=False)
    gender_code = Column(String(1), nullable=False)  # 'M', 'F', or 'X'
    age_band = Column(SmallInteger, nullable=False)
    primary_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sanarch_profiles.id"),
        nullable=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Self-referential relationship: primary → dependents
    dependents = relationship(
        "SanarchProfile",
        backref="primary_profile",
        remote_side=[id],
        foreign_keys=[primary_id],
    )

    __table_args__ = (
        CheckConstraint("profile_type IN ('P', 'D')", name="ck_profile_type"),
        CheckConstraint("gender_code IN ('M', 'F', 'X')", name="ck_gender_code"),
        UniqueConstraint("family_serial", "member_index", name="uq_family_member"),
        Index("ix_family_serial", "family_serial"),
    )

    def __repr__(self) -> str:
        return f"<SanarchProfile {self.sanarch_id} ({self.profile_type}{self.member_index:02d})>"
