"""add_role_to_students

Revision ID: 47b1b76f1276
Revises: 44c38693bd96
Create Date: 2026-04-28 21:16:10.417044

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '47b1b76f1276'
down_revision: Union[str, Sequence[str], None] = '44c38693bd96'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE userrole AS ENUM ('student', 'admin')")
    op.add_column("students", sa.Column("role", sa.Enum("student", "admin", name="userrole"), nullable=False, server_default="student"))


def downgrade() -> None:
    op.drop_column("students", "role")
    op.execute("DROP TYPE userrole")
