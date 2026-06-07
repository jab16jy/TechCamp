"""add exito and rendimiento_real to analisis

Revision ID: d4e5f6a7b8c9
Revises: c2a3e4f5b6d7
Create Date: 2026-06-06 21:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'd4e5f6a7b8c9'
down_revision = 'c2a3e4f5b6d7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('analisis', sa.Column('exito', sa.Boolean(), nullable=True))
    op.add_column('analisis', sa.Column('rendimiento_real', sa.Float(), nullable=True))
    op.create_index('idx_analisis_exito', 'analisis', ['exito'])
    op.create_index('idx_analisis_rendimiento', 'analisis', ['rendimiento_real'])


def downgrade() -> None:
    op.drop_index('idx_analisis_rendimiento', table_name='analisis')
    op.drop_index('idx_analisis_exito', table_name='analisis')
    op.drop_column('analisis', 'rendimiento_real')
    op.drop_column('analisis', 'exito')
