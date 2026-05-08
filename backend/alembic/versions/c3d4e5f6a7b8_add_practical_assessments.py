"""add practical assessments

Revision ID: c3d4e5f6a7b8
Revises: c2d3e4f5a6b7
Create Date: 2026-05-07 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "c3d4e5f6a7b8"
down_revision = "c2d3e4f5a6b7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    status_enum = postgresql.ENUM("reviewed", "returned", name="practicalassessmentstatus", create_type=False)
    status_enum.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "practical_assessment_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("scheduled_meeting_id", sa.Integer(), sa.ForeignKey("scheduled_meetings.id"), nullable=False, index=True),
        sa.Column("class_offering_id", sa.Integer(), sa.ForeignKey("class_offerings.id"), nullable=False, index=True),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=False, index=True),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("status", status_enum, nullable=False),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("recorded_by_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=True, index=True),
        sa.UniqueConstraint("scheduled_meeting_id", "student_id"),
    )


def downgrade() -> None:
    op.drop_table("practical_assessment_records")
    sa.Enum(name="practicalassessmentstatus").drop(op.get_bind(), checkfirst=True)
