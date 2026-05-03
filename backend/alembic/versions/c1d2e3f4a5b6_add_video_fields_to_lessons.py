"""add video fields to lessons

Revision ID: c1d2e3f4a5b6
Revises: b8c9d0e1f2a3
Create Date: 2026-05-03 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = 'c1d2e3f4a5b6'
down_revision = 'b8c9d0e1f2a3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('lessons', sa.Column('video_url', sa.String(500), nullable=True))
    op.add_column('lessons', sa.Column('video_path', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('lessons', 'video_path')
    op.drop_column('lessons', 'video_url')
