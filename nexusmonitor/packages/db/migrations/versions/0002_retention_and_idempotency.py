"""
Revision ID: 0002_retention_and_idempotency
Revises: 0001
Create Date: 2026-03-25

Patching structural TSDB logic for idempotency (UPSERT limits) and 
storage chunk eviction rules (FIX-L4-004, FIX-L4-005).
"""
from alembic import op
import sqlalchemy as sa

revision = '0002_retention_and_idempotency'
down_revision = '0001_initial_schema'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Enforce Idempotency via Unique Constraints on the hypertable
    # Allows INSERT ... ON CONFLICT DO NOTHING avoiding replay deduplication errors.
    op.create_unique_constraint(
        'uq_metric_asset_time',
        'metrics',
        ['asset_id', 'metric_key', 'timestamp']
    )
    
    # 2. Add TimescaleDB Retention Policy (Drop chunks older than 90 days)
    # This prevents bounding disk-full crashes natively.
    op.execute("""
    SELECT add_retention_policy('metrics', drop_after => INTERVAL '90 days');
    """)

def downgrade():
    op.execute("""
    SELECT remove_retention_policy('metrics');
    """)
    op.drop_constraint('uq_metric_asset_time', 'metrics', type_='unique')
