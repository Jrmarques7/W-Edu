"""add notification domain

Revision ID: d4e5f6a7b8c9
Revises: c9d0e1f2a3b4
Create Date: 2026-04-30 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "d4e5f6a7b8c9"
down_revision = "c9d0e1f2a3b4"
branch_labels = None
depends_on = None


notification_channel = sa.Enum("internal", "whatsapp", "email", "push", name="notificationchannel")
notification_status = sa.Enum("pending", "sent", "failed", name="notificationstatus")
notification_event_type = sa.Enum(
    "class_created",
    "meeting_created",
    "meeting_reminder",
    "absence_registered",
    "attendance_recorded",
    "content_published",
    "certificate_issued",
    name="notificationeventtype",
)


def upgrade() -> None:
    op.create_table(
        "notification_templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(length=120), nullable=False, index=True),
        sa.Column("channel", notification_channel, nullable=False),
        sa.Column("title_template", sa.String(length=200), nullable=False),
        sa.Column("body_template", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("key", "channel"),
    )

    op.create_table(
        "notification_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_type", notification_event_type, nullable=False, index=True),
        sa.Column("channel", notification_channel, nullable=False),
        sa.Column("template_key", sa.String(length=120), nullable=True, index=True),
        sa.Column("recipient_student_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=True, index=True),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=True, index=True),
        sa.Column("class_offering_id", sa.Integer(), sa.ForeignKey("class_offerings.id"), nullable=True, index=True),
        sa.Column("scheduled_meeting_id", sa.Integer(), sa.ForeignKey("scheduled_meetings.id"), nullable=True, index=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", notification_status, nullable=False),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("notification_events")
    op.drop_table("notification_templates")
