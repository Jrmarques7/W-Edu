"""add_instructor_availability_and_ratings

Revision ID: e4f5a6b7c8d9
Revises: d3e4f5a6b7c8
Create Date: 2026-04-30 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e4f5a6b7c8d9"
down_revision: Union[str, Sequence[str], None] = "d3e4f5a6b7c8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "instructor_availability",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("instructor_profile_id", sa.Integer(), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.String(length=5), nullable=False),
        sa.Column("end_time", sa.String(length=5), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["instructor_profile_id"], ["instructor_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_instructor_availability_instructor_profile_id"), "instructor_availability", ["instructor_profile_id"], unique=False)

    op.create_table(
        "instructor_ratings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("instructor_profile_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["instructor_profile_id"], ["instructor_profiles.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_instructor_ratings_instructor_profile_id"), "instructor_ratings", ["instructor_profile_id"], unique=False)
    op.create_index(op.f("ix_instructor_ratings_student_id"), "instructor_ratings", ["student_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_instructor_ratings_student_id"), table_name="instructor_ratings")
    op.drop_index(op.f("ix_instructor_ratings_instructor_profile_id"), table_name="instructor_ratings")
    op.drop_table("instructor_ratings")
    op.drop_index(op.f("ix_instructor_availability_instructor_profile_id"), table_name="instructor_availability")
    op.drop_table("instructor_availability")
