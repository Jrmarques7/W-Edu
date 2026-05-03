"""add video fields to lessons

Revision ID: a1b2c3d4e5f6
Revises: f6a7b8c9d0e1
Create Date: 2026-05-02 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('lessons', sa.Column('video_url', sa.String(500), nullable=True))
    op.add_column('lessons', sa.Column('video_path', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('lessons', 'video_path')
    op.drop_column('lessons', 'video_url')
