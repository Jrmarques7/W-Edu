"""close_meetings_with_absence_summary

Revision ID: f5a6b7c8d9e0
Revises: e4f5a6b7c8d9
Create Date: 2026-04-30 18:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f5a6b7c8d9e0"
down_revision: Union[str, Sequence[str], None] = "e4f5a6b7c8d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("scheduled_meetings", sa.Column("is_closed", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("scheduled_meetings", sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True))
    op.alter_column("scheduled_meetings", "is_closed", server_default=None)


def downgrade() -> None:
    op.drop_column("scheduled_meetings", "closed_at")
    op.drop_column("scheduled_meetings", "is_closed")
