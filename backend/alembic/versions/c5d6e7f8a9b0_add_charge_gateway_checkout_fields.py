"""add charge gateway checkout fields

Revision ID: c5d6e7f8a9b0
Revises: c4d5e6f7a8b9
Create Date: 2026-05-07 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "c5d6e7f8a9b0"
down_revision = "c4d5e6f7a8b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("charges", sa.Column("gateway_customer_id", sa.String(length=120), nullable=True))
    op.add_column("charges", sa.Column("gateway_status", sa.String(length=80), nullable=True))
    op.add_column("charges", sa.Column("checkout_url", sa.String(length=500), nullable=True))
    op.add_column("charges", sa.Column("bank_slip_url", sa.String(length=500), nullable=True))
    op.add_column("charges", sa.Column("pix_qr_code_payload", sa.Text(), nullable=True))
    op.add_column("charges", sa.Column("pix_qr_code_image", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("charges", "pix_qr_code_image")
    op.drop_column("charges", "pix_qr_code_payload")
    op.drop_column("charges", "bank_slip_url")
    op.drop_column("charges", "checkout_url")
    op.drop_column("charges", "gateway_status")
    op.drop_column("charges", "gateway_customer_id")
