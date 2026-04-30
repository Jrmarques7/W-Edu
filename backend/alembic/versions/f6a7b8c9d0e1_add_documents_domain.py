"""add documents domain

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-04-30 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


document_type = sa.Enum("contract", "term", "material", "policy", "template", "other", name="documenttype")
document_status = sa.Enum("draft", "active", "archived", name="documentstatus")


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=200), nullable=False, index=True),
        sa.Column("document_type", document_type, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", document_status, nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=True, index=True),
        sa.Column("class_offering_id", sa.Integer(), sa.ForeignKey("class_offerings.id"), nullable=True, index=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id"), nullable=True, index=True),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=True, index=True),
        sa.Column("uploaded_by_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=True, index=True),
        sa.Column("latest_version_number", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_signed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("signed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("signed_by", sa.String(length=200), nullable=True),
        sa.Column("external_reference", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "document_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("document_id", sa.Integer(), sa.ForeignKey("documents.id"), nullable=False, index=True),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=True),
        sa.Column("mime_type", sa.String(length=120), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("storage_path", sa.String(length=500), nullable=True),
        sa.Column("external_url", sa.String(length=500), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=True, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("document_id", "version_number"),
    )


def downgrade() -> None:
    op.drop_table("document_versions")
    op.drop_table("documents")
