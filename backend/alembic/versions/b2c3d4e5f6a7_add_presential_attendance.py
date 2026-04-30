"""add_presential_attendance

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-30 16:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE attendancestatus AS ENUM ('present', 'late', 'absent');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE attendancemethod AS ENUM ('manual', 'qr_code', 'webhook', 'biometric', 'facial');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )

    op.create_table(
        "attendance_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("scheduled_meeting_id", sa.Integer(), nullable=False),
        sa.Column("class_offering_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("present", "late", "absent", name="attendancestatus", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "method",
            postgresql.ENUM("manual", "qr_code", "webhook", "biometric", "facial", name="attendancemethod", create_type=False),
            nullable=False,
        ),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["class_offering_id"], ["class_offerings.id"]),
        sa.ForeignKeyConstraint(["scheduled_meeting_id"], ["scheduled_meetings.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("scheduled_meeting_id", "student_id"),
    )
    op.create_index(op.f("ix_attendance_records_class_offering_id"), "attendance_records", ["class_offering_id"], unique=False)
    op.create_index(op.f("ix_attendance_records_scheduled_meeting_id"), "attendance_records", ["scheduled_meeting_id"], unique=False)
    op.create_index(op.f("ix_attendance_records_student_id"), "attendance_records", ["student_id"], unique=False)

    op.create_table(
        "checkin_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("scheduled_meeting_id", sa.Integer(), nullable=False),
        sa.Column("token", sa.String(length=120), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["scheduled_meeting_id"], ["scheduled_meetings.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_checkin_tokens_scheduled_meeting_id"), "checkin_tokens", ["scheduled_meeting_id"], unique=False)
    op.create_index(op.f("ix_checkin_tokens_token"), "checkin_tokens", ["token"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_checkin_tokens_token"), table_name="checkin_tokens")
    op.drop_index(op.f("ix_checkin_tokens_scheduled_meeting_id"), table_name="checkin_tokens")
    op.drop_table("checkin_tokens")
    op.drop_index(op.f("ix_attendance_records_student_id"), table_name="attendance_records")
    op.drop_index(op.f("ix_attendance_records_scheduled_meeting_id"), table_name="attendance_records")
    op.drop_index(op.f("ix_attendance_records_class_offering_id"), table_name="attendance_records")
    op.drop_table("attendance_records")
    op.execute("DROP TYPE attendancemethod")
    op.execute("DROP TYPE attendancestatus")
