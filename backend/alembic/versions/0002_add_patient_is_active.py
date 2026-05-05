"""add is_active to patients

Revision ID: 0002
Revises: 0001
Create Date: 2025-01-02 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("patients", sa.Column("is_active", sa.Boolean(),
                  nullable=False, server_default="true"))

def downgrade():
    op.drop_column("patients", "is_active")
