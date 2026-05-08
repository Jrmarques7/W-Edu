"""rename students table to users

Revision ID: c6d7e8f9a0b1
Revises: c5d6e7f8a9b0
Create Date: 2026-05-08 00:00:00.000000
"""

from alembic import op


revision = "c6d7e8f9a0b1"
down_revision = "c5d6e7f8a9b0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.rename_table("students", "users")
    op.execute("ALTER INDEX IF EXISTS ix_students_email RENAME TO ix_users_email")
    op.execute("ALTER INDEX IF EXISTS ix_students_organization_id RENAME TO ix_users_organization_id")
    op.execute("ALTER INDEX IF EXISTS students_email_key RENAME TO users_email_key")
    op.execute(
        "ALTER TABLE users RENAME CONSTRAINT fk_students_organization_id_organizations "
        "TO fk_users_organization_id_organizations"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE users RENAME CONSTRAINT fk_users_organization_id_organizations "
        "TO fk_students_organization_id_organizations"
    )
    op.execute("ALTER INDEX IF EXISTS users_email_key RENAME TO students_email_key")
    op.execute("ALTER INDEX IF EXISTS ix_users_organization_id RENAME TO ix_students_organization_id")
    op.execute("ALTER INDEX IF EXISTS ix_users_email RENAME TO ix_students_email")
    op.rename_table("users", "students")
