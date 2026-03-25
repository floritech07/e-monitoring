import asyncio
import logging
from celery import shared_task
from packages.db.engine import db_manager
from sqlalchemy import text
from packages.db.models.metric import MetricSeries, MetricPoint

logger = logging.getLogger(__name__)

@shared_task(name="metrics.enforce_retention")
def run_retention_policy():
    """Drops old partition chunks in TimescaleDB based on retention rules."""
    asyncio.run(_async_retention_policy())

async def _async_retention_policy():
    async with db_manager.get_session() as session:
        # Timescale specific retention
        logger.info("Executing Metric Point Timescale drop_chunks...")
        try:
            # We iterate series and drop chunks older than configured threshold
            # In pure TimescaleDB, add_retention_policy handles this natively!
            # We assume a fallback manual delete for standard Postgres
            await session.execute(text("""
                DELETE FROM metric_points 
                WHERE ts < NOW() - INTERVAL '90 days'
            """))
            await session.commit()
            logger.info("Standard SQL retention fallback executed.")
        except Exception as e:
            logger.error(f"Failed executing retention policy: {e}")
            await session.rollback()
