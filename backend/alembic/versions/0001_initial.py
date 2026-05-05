"""initial schema

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("sanarch_id", sa.String(), nullable=False),
        sa.Column("phone_number", sa.String(), nullable=False),
        sa.Column("firebase_uid", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("date_of_birth", sa.String(), nullable=True),
        sa.Column("height_cm", sa.String(), nullable=True),
        sa.Column("weight_kg", sa.String(), nullable=True),
        sa.Column("profile_photo_url", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_users_sanarch_id", "users", ["sanarch_id"], unique=True)
    op.create_index("ix_users_phone_number", "users", ["phone_number"], unique=True)
    op.create_index("ix_users_firebase_uid", "users", ["firebase_uid"], unique=True)

    # patients
    op.create_table(
        "patients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("sanarch_id", sa.String(), nullable=False),
        sa.Column("relationship_to_owner", sa.String(), nullable=True),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("date_of_birth", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_patients_sanarch_id", "patients", ["sanarch_id"], unique=True)
    op.create_index("ix_patients_owner_id", "patients", ["owner_id"])

    # documents
    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("patients.id"), nullable=True),
        sa.Column("original_filename", sa.String(), nullable=True),
        sa.Column("s3_key", sa.String(), nullable=True),
        sa.Column("s3_tmp_key", sa.String(), nullable=True),
        sa.Column("mime_type", sa.String(), nullable=True),
        sa.Column("label", sa.String(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "uploading", "scanning", "extracting",
                "pending_review", "complete", "failed",
                name="documentstatus"
            ),
            nullable=True,
        ),
        sa.Column("extracted_data", postgresql.JSON(), nullable=True),
        sa.Column("page_count", sa.String(), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_documents_owner_id", "documents", ["owner_id"])
    op.create_index("ix_documents_status", "documents", ["status"])

    # medical_events
    op.create_table(
        "medical_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("documents.id"), nullable=True),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("hospital_name", sa.String(), nullable=True),
        sa.Column("doctor_name", sa.String(), nullable=True),
        sa.Column("diagnosis", postgresql.JSON(), nullable=True),
        sa.Column("medications", postgresql.JSON(), nullable=True),
        sa.Column("lab_values", postgresql.JSON(), nullable=True),
        sa.Column("summary", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_medical_events_patient_id", "medical_events", ["patient_id"])
    op.create_index("ix_medical_events_event_date", "medical_events", ["event_date"])

    # share_tokens
    op.create_table(
        "share_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("event_ids", postgresql.JSON(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("is_revoked", sa.Boolean(), server_default="false"),
        sa.Column("doctor_name", sa.String(), nullable=True),
        sa.Column("accessed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_share_tokens_token", "share_tokens", ["token"], unique=True)
    op.create_index("ix_share_tokens_owner_id", "share_tokens", ["owner_id"])


def downgrade() -> None:
    op.drop_table("share_tokens")
    op.drop_table("medical_events")
    op.drop_table("documents")
    op.drop_table("patients")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS documentstatus")