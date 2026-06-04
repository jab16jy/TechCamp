"""add fecha and escena_id columns

Revision ID: c2a3e4f5b6d7
Revises: 9f88a7e1bb13
Create Date: 2026-06-04 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'c2a3e4f5b6d7'
down_revision = '9f88a7e1bb13'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('indices_satelitales', sa.Column('fecha', sa.DateTime(), nullable=True))
    op.add_column('indices_satelitales', sa.Column('escena_id', sa.String(100), nullable=True))
    op.create_index('idx_indices_satelitales_fecha', 'indices_satelitales', ['fecha'])
    op.create_index('idx_indices_satelitales_escena', 'indices_satelitales', ['escena_id'])


def downgrade() -> None:
    op.drop_index('idx_indices_satelitales_escena', table_name='indices_satelitales')
    op.drop_index('idx_indices_satelitales_fecha', table_name='indices_satelitales')
    op.drop_column('indices_satelitales', 'escena_id')
    op.drop_column('indices_satelitales', 'fecha')
