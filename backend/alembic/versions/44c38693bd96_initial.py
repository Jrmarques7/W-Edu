"""initial

Revision ID: 44c38693bd96
Revises:
Create Date: 2026-04-28

"""
from alembic import op
import sqlalchemy as sa

revision = "44c38693bd96"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "students",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(200), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(200), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_students_email", "students", ["email"])

    op.create_table(
        "courses",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("agent_id", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "lessons",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("course_id", sa.Integer, sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("order", sa.Integer, nullable=False, server_default="0"),
        sa.Column(
            "type",
            sa.Enum("text", "video", "voice", name="lessontype"),
            nullable=False,
            server_default="text",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_lessons_course_id", "lessons", ["course_id"])

    op.create_table(
        "enrollments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("student_id", sa.Integer, sa.ForeignKey("students.id"), nullable=False),
        sa.Column("course_id", sa.Integer, sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("enrolled_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("student_id", "course_id"),
    )
    op.create_index("ix_enrollments_student_id", "enrollments", ["student_id"])
    op.create_index("ix_enrollments_course_id", "enrollments", ["course_id"])

    op.create_table(
        "progress",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("student_id", sa.Integer, sa.ForeignKey("students.id"), nullable=False),
        sa.Column("lesson_id", sa.Integer, sa.ForeignKey("lessons.id"), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "in_progress", "done", name="progressstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("student_id", "lesson_id"),
    )
    op.create_index("ix_progress_student_id", "progress", ["student_id"])
    op.create_index("ix_progress_lesson_id", "progress", ["lesson_id"])

    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("student_id", sa.Integer, sa.ForeignKey("students.id"), nullable=False),
        sa.Column("lesson_id", sa.Integer, sa.ForeignKey("lessons.id"), nullable=False),
        sa.Column("bevox_session_id", sa.String(100), nullable=True),
        sa.Column("transcript", sa.Text, nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_sessions_student_id", "sessions", ["student_id"])
    op.create_index("ix_sessions_bevox_session_id", "sessions", ["bevox_session_id"])

    op.create_table(
        "attendance",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("student_id", sa.Integer, sa.ForeignKey("students.id"), nullable=False),
        sa.Column("lesson_id", sa.Integer, sa.ForeignKey("lessons.id"), nullable=False),
        sa.Column("session_id", sa.Integer, sa.ForeignKey("sessions.id"), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_attendance_student_id", "attendance", ["student_id"])
    op.create_index("ix_attendance_lesson_id", "attendance", ["lesson_id"])


def downgrade() -> None:
    op.drop_table("attendance")
    op.drop_table("sessions")
    op.drop_table("progress")
    op.drop_table("enrollments")
    op.drop_table("lessons")
    op.drop_table("courses")
    op.drop_table("students")
    op.execute("DROP TYPE IF EXISTS lessontype")
    op.execute("DROP TYPE IF EXISTS progressstatus")
