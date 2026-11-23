"""add export states table

Revision ID: b712c98a3e14
Revises: af83ba703f95
Create Date: 2026-11-23 19:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b712c98a3e14'
down_revision = 'af83ba703f95'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    insp = sa.inspect(conn)
    tables = insp.get_table_names()
    if 'export_states' not in tables:
        op.create_table(
            'export_states',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('last_exported_hash', sa.String(length=64), nullable=True),
            sa.Column('last_exported_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )


def downgrade():
    conn = op.get_bind()
    insp = sa.inspect(conn)
    tables = insp.get_table_names()
    if 'export_states' in tables:
        op.drop_table('export_states')
