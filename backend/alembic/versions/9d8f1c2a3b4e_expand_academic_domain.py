"""expand_academic_domain

Revision ID: 9d8f1c2a3b4e
Revises: be66967d5ecd
Create Date: 2026-04-30 15:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9d8f1c2a3b4e"
down_revision: Union[str, Sequence[str], None] = "be66967d5ecd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE coursemodality AS ENUM ('online', 'in_person', 'hybrid')")
    op.add_column(
        "courses",
        sa.Column(
            "modality",
            sa.Enum("online", "in_person", "hybrid", name="coursemodality"),
            nullable=False,
            server_default="online",
        ),
    )
    op.alter_column("courses", "modality", server_default=None)

    op.execute("ALTER TYPE lessontype ADD VALUE IF NOT EXISTS 'pdf'")
    op.execute("ALTER TYPE lessontype ADD VALUE IF NOT EXISTS 'live'")
    op.execute("ALTER TYPE lessontype ADD VALUE IF NOT EXISTS 'in_person'")
    op.execute("ALTER TYPE lessontype ADD VALUE IF NOT EXISTS 'assessment'")

    op.create_table(
        "course_modules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_course_modules_course_id"), "course_modules", ["course_id"], unique=False)

    op.add_column("lessons", sa.Column("module_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_lessons_module_id"), "lessons", ["module_id"], unique=False)
    op.create_foreign_key("fk_lessons_module_id_course_modules", "lessons", "course_modules", ["module_id"], ["id"])

    op.create_table(
        "learning_paths",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "course_prerequisites",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("prerequisite_course_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.ForeignKeyConstraint(["prerequisite_course_id"], ["courses.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("course_id", "prerequisite_course_id"),
    )
    op.create_index(op.f("ix_course_prerequisites_course_id"), "course_prerequisites", ["course_id"], unique=False)
    op.create_index(
        op.f("ix_course_prerequisites_prerequisite_course_id"),
        "course_prerequisites",
        ["prerequisite_course_id"],
        unique=False,
    )

    op.create_table(
        "learning_path_courses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("learning_path_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.ForeignKeyConstraint(["learning_path_id"], ["learning_paths.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("learning_path_id", "course_id"),
    )
    op.create_index(op.f("ix_learning_path_courses_course_id"), "learning_path_courses", ["course_id"], unique=False)
    op.create_index(
        op.f("ix_learning_path_courses_learning_path_id"),
        "learning_path_courses",
        ["learning_path_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_learning_path_courses_learning_path_id"), table_name="learning_path_courses")
    op.drop_index(op.f("ix_learning_path_courses_course_id"), table_name="learning_path_courses")
    op.drop_table("learning_path_courses")
    op.drop_index(op.f("ix_course_prerequisites_prerequisite_course_id"), table_name="course_prerequisites")
    op.drop_index(op.f("ix_course_prerequisites_course_id"), table_name="course_prerequisites")
    op.drop_table("course_prerequisites")
    op.drop_table("learning_paths")
    op.drop_constraint("fk_lessons_module_id_course_modules", "lessons", type_="foreignkey")
    op.drop_index(op.f("ix_lessons_module_id"), table_name="lessons")
    op.drop_column("lessons", "module_id")
    op.drop_index(op.f("ix_course_modules_course_id"), table_name="course_modules")
    op.drop_table("course_modules")
    op.drop_column("courses", "modality")
    op.execute("DROP TYPE coursemodality")
