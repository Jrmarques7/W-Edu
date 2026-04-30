"""add_schedule_domain

Revision ID: a1b2c3d4e5f6
Revises: 9d8f1c2a3b4e
Create Date: 2026-04-30 15:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "9d8f1c2a3b4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE classstatus AS ENUM ('draft', 'open', 'closed', 'completed', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE classenrollmentstatus AS ENUM ('active', 'cancelled', 'completed');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE meetingtype AS ENUM ('in_person', 'live', 'hybrid');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )

    op.create_table(
        "locations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "rooms",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("location_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("resources", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["location_id"], ["locations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_rooms_location_id"), "rooms", ["location_id"], unique=False)

    op.create_table(
        "class_offerings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("draft", "open", "closed", "completed", "cancelled", name="classstatus", create_type=False),
            nullable=False,
        ),
        sa.Column("location_id", sa.Integer(), nullable=True),
        sa.Column("room_id", sa.Integer(), nullable=True),
        sa.Column("instructor_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.ForeignKeyConstraint(["instructor_id"], ["students.id"]),
        sa.ForeignKeyConstraint(["location_id"], ["locations.id"]),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_class_offerings_course_id"), "class_offerings", ["course_id"], unique=False)
    op.create_index(op.f("ix_class_offerings_instructor_id"), "class_offerings", ["instructor_id"], unique=False)
    op.create_index(op.f("ix_class_offerings_location_id"), "class_offerings", ["location_id"], unique=False)
    op.create_index(op.f("ix_class_offerings_room_id"), "class_offerings", ["room_id"], unique=False)

    op.create_table(
        "class_enrollments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("class_offering_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("active", "cancelled", "completed", name="classenrollmentstatus", create_type=False),
            nullable=False,
        ),
        sa.Column("enrolled_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["class_offering_id"], ["class_offerings.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("class_offering_id", "student_id"),
    )
    op.create_index(op.f("ix_class_enrollments_class_offering_id"), "class_enrollments", ["class_offering_id"], unique=False)
    op.create_index(op.f("ix_class_enrollments_student_id"), "class_enrollments", ["student_id"], unique=False)

    op.create_table(
        "scheduled_meetings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("class_offering_id", sa.Integer(), nullable=False),
        sa.Column("lesson_id", sa.Integer(), nullable=True),
        sa.Column("room_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "type",
            postgresql.ENUM("in_person", "live", "hybrid", name="meetingtype", create_type=False),
            nullable=False,
        ),
        sa.Column("meeting_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["class_offering_id"], ["class_offerings.id"]),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"]),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_scheduled_meetings_class_offering_id"), "scheduled_meetings", ["class_offering_id"], unique=False)
    op.create_index(op.f("ix_scheduled_meetings_lesson_id"), "scheduled_meetings", ["lesson_id"], unique=False)
    op.create_index(op.f("ix_scheduled_meetings_room_id"), "scheduled_meetings", ["room_id"], unique=False)

    op.create_table(
        "waitlist_entries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("class_offering_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["class_offering_id"], ["class_offerings.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("class_offering_id", "student_id"),
    )
    op.create_index(op.f("ix_waitlist_entries_class_offering_id"), "waitlist_entries", ["class_offering_id"], unique=False)
    op.create_index(op.f("ix_waitlist_entries_student_id"), "waitlist_entries", ["student_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_waitlist_entries_student_id"), table_name="waitlist_entries")
    op.drop_index(op.f("ix_waitlist_entries_class_offering_id"), table_name="waitlist_entries")
    op.drop_table("waitlist_entries")
    op.drop_index(op.f("ix_scheduled_meetings_room_id"), table_name="scheduled_meetings")
    op.drop_index(op.f("ix_scheduled_meetings_lesson_id"), table_name="scheduled_meetings")
    op.drop_index(op.f("ix_scheduled_meetings_class_offering_id"), table_name="scheduled_meetings")
    op.drop_table("scheduled_meetings")
    op.drop_index(op.f("ix_class_enrollments_student_id"), table_name="class_enrollments")
    op.drop_index(op.f("ix_class_enrollments_class_offering_id"), table_name="class_enrollments")
    op.drop_table("class_enrollments")
    op.drop_index(op.f("ix_class_offerings_room_id"), table_name="class_offerings")
    op.drop_index(op.f("ix_class_offerings_location_id"), table_name="class_offerings")
    op.drop_index(op.f("ix_class_offerings_instructor_id"), table_name="class_offerings")
    op.drop_index(op.f("ix_class_offerings_course_id"), table_name="class_offerings")
    op.drop_table("class_offerings")
    op.drop_index(op.f("ix_rooms_location_id"), table_name="rooms")
    op.drop_table("rooms")
    op.drop_table("locations")
    op.execute("DROP TYPE meetingtype")
    op.execute("DROP TYPE classenrollmentstatus")
    op.execute("DROP TYPE classstatus")
