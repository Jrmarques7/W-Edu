"""add certification domain

Revision ID: c9d0e1f2a3b4
Revises: f5a6b7c8d9e0
Create Date: 2026-04-30 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c9d0e1f2a3b4"
down_revision = "f5a6b7c8d9e0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "course_completion_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False, index=True),
        sa.Column("require_lessons_complete", sa.Boolean(), nullable=False, default=True),
        sa.Column("minimum_progress_percent", sa.Integer(), nullable=False, default=100),
        sa.Column("require_quiz", sa.Boolean(), nullable=False, default=True),
        sa.Column("minimum_quiz_score", sa.Integer(), nullable=False, default=70),
        sa.Column("require_attendance", sa.Boolean(), nullable=False, default=False),
        sa.Column("minimum_attendance_percent", sa.Integer(), nullable=False, default=75),
        sa.Column("auto_issue", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("course_id"),
    )

    op.create_table(
        "certificates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=False, index=True),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False, index=True),
        sa.Column("validation_code", sa.String(length=120), nullable=False, unique=True, index=True),
        sa.Column("issued_by_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=True, index=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_reason", sa.Text(), nullable=True),
        sa.Column("pdf_url", sa.String(length=500), nullable=True),
        sa.UniqueConstraint("student_id", "course_id"),
    )


def downgrade() -> None:
    op.drop_table("certificates")
    op.drop_table("course_completion_rules")
