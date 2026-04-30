"""add_user_profiles_and_organizations

Revision ID: d3e4f5a6b7c8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-30 17:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d3e4f5a6b7c8"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'instructor'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'coordinator'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'company_manager'")

    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("legal_name", sa.String(length=200), nullable=True),
        sa.Column("document", sa.String(length=50), nullable=True),
        sa.Column("contact_email", sa.String(length=200), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organizations_document"), "organizations", ["document"], unique=False)
    op.create_index(op.f("ix_organizations_name"), "organizations", ["name"], unique=True)

    op.add_column("students", sa.Column("organization_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_students_organization_id"), "students", ["organization_id"], unique=False)
    op.create_foreign_key("fk_students_organization_id_organizations", "students", "organizations", ["organization_id"], ["id"])

    op.create_table(
        "student_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("document", sa.String(length=50), nullable=True),
        sa.Column("position", sa.String(length=120), nullable=True),
        sa.Column("department", sa.String(length=120), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_student_profiles_document"), "student_profiles", ["document"], unique=False)
    op.create_index(op.f("ix_student_profiles_student_id"), "student_profiles", ["student_id"], unique=True)

    op.create_table(
        "instructor_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("specialties", sa.Text(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("rating", sa.String(length=20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_instructor_profiles_student_id"), "instructor_profiles", ["student_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_instructor_profiles_student_id"), table_name="instructor_profiles")
    op.drop_table("instructor_profiles")
    op.drop_index(op.f("ix_student_profiles_student_id"), table_name="student_profiles")
    op.drop_index(op.f("ix_student_profiles_document"), table_name="student_profiles")
    op.drop_table("student_profiles")
    op.drop_constraint("fk_students_organization_id_organizations", "students", type_="foreignkey")
    op.drop_index(op.f("ix_students_organization_id"), table_name="students")
    op.drop_column("students", "organization_id")
    op.drop_index(op.f("ix_organizations_name"), table_name="organizations")
    op.drop_index(op.f("ix_organizations_document"), table_name="organizations")
    op.drop_table("organizations")
