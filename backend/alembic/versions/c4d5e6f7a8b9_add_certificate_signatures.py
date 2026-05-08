"""add certificate signatures

Revision ID: c4d5e6f7a8b9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-07 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "c4d5e6f7a8b9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("certificates", sa.Column("signature_algorithm", sa.String(length=80), nullable=True))
    op.add_column("certificates", sa.Column("signature_hash", sa.String(length=128), nullable=True))
    op.add_column("certificates", sa.Column("signed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("certificates", "signed_at")
    op.drop_column("certificates", "signature_hash")
    op.drop_column("certificates", "signature_algorithm")
