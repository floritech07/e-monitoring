from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text, func

from packages.db.models.metric import MetricSeries, MetricPoint
import logging

logger = logging.getLogger(__name__)

class MetricQueryService:
    @staticmethod
    async def list_series(session: AsyncSession, asset_id: str):
        stmt = select(MetricSeries).where(MetricSeries.asset_id == asset_id)
        result = await session.execute(stmt)
        return [{"id": s.id, "name": s.name, "unit": s.unit} for s in result.scalars()]

    @staticmethod
    async def execute_query(session: AsyncSession, series_id: str, start_ts: int, end_ts: int, step: str, aggregation: str):
        """
        Executes a time-series range query.
        Uses TimescaleDB time_bucket() if Postgres backend, otherwise normal SQL group by.
        """
        import os
        engine_type = os.getenv("DB_ENGINE", "postgresql").lower()
        
        from datetime import datetime, timezone
        start_datetime = datetime.fromtimestamp(start_ts, tz=timezone.utc)
        end_datetime = datetime.fromtimestamp(end_ts, tz=timezone.utc)
        
        if engine_type == "postgresql":
            # Leverage TimescaleDB
            query = f"""
                SELECT time_bucket('{step}', ts) AS time_b, 
                       {aggregation}(value) as agg_value
                FROM metric_points
                WHERE series_id = :series_id
                  AND ts >= :start_ts AND ts <= :end_ts
                GROUP BY time_b
                ORDER BY time_b ASC
            """
            result = await session.execute(text(query), {
                "series_id": series_id, "start_ts": start_datetime, "end_ts": end_datetime
            })
            
            # Format output Prometheus style
            values = [[int(row[0].timestamp()), float(row[1])] for row in result.fetchall()]
        else:
            # Basic fallback without time_bucket (e.g. SQLite local test)
            stmt = select(MetricPoint.ts, MetricPoint.value).where(
                MetricPoint.series_id == series_id,
                MetricPoint.ts >= start_datetime,
                MetricPoint.ts <= end_datetime
            ).order_by(MetricPoint.ts.asc())
            result = await session.execute(stmt)
            values = [[int(r.ts.timestamp()), float(r.value)] for r in result]
            
        return [{"metric": {"series_id": str(series_id)}, "values": values}]
        
    @staticmethod
    async def get_latest(session: AsyncSession, asset_id: str):
        # Simplistic stub for latest metrics across series
        stmt = select(MetricSeries).where(MetricSeries.asset_id == asset_id)
        series_res = await session.execute(stmt)
        
        result = {}
        for s in series_res.scalars():
            query = select(MetricPoint.value).where(MetricPoint.series_id == s.id).order_by(MetricPoint.ts.desc()).limit(1)
            val = (await session.execute(query)).scalar()
            result[s.name] = float(val) if val is not None else 0.0
            
        return result
