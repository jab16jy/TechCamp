"""create datos_campo table

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-09 08:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'datos_campo',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('cultivo', sa.String(100), nullable=False),
        sa.Column('departamento', sa.String(100), nullable=True),
        sa.Column('municipio', sa.String(100), nullable=True),
        sa.Column('lat', sa.Float(), nullable=True),
        sa.Column('lng', sa.Float(), nullable=True),
        sa.Column('ph', sa.Float(), nullable=True),
        sa.Column('mo', sa.Float(), nullable=True),
        sa.Column('textura', sa.String(50), nullable=True),
        sa.Column('ndvi', sa.Float(), nullable=True),
        sa.Column('ndwi', sa.Float(), nullable=True),
        sa.Column('rendimiento', sa.Float(), nullable=True),
        sa.Column('fuente', sa.String(20), nullable=True),
        sa.Column('anio', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_datos_campo_cultivo', 'datos_campo', ['cultivo'])
    op.create_index('idx_datos_campo_cultivo_fuente', 'datos_campo', ['cultivo', 'fuente'])


def downgrade() -> None:
    op.drop_index('idx_datos_campo_cultivo_fuente', table_name='datos_campo')
    op.drop_index('idx_datos_campo_cultivo', table_name='datos_campo')
    op.drop_table('datos_campo')
