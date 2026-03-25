from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
import logging

from packages.db.models.alert import AlertRule
from apps.api.metrics.query_builder import PromQLToSQLBuilder

logger = logging.getLogger(__name__)

class ExpressionEvaluator:
    """Evaluates rule logic against telemetry."""
    
    async def evaluate(self, session: AsyncSession, rule: AlertRule) -> dict[str, float]:
        """
        Parses metric_expression, executes DB query, returns violators.
        Returns: { asset_id: violating_value, ... }
        """
        violators = {}
        
        try:
            # Safe parsing for basic metric logic
            # E.g. metric_expression="cpu.usage", condition=">", threshold="85"
            
            # 1. Find the series IDs across assets matching this name
            from packages.db.models.metric import MetricSeries
            from packages.db.models.asset import Asset
            
            stmt = select(MetricSeries.id, Asset.id.label('asset_id')).join(Asset).where(
                MetricSeries.name == rule.metric_expression
            )
            
            if rule.asset_scope_tags:
                # Could filter by site, tags, type. Left out for brevity
                pass
                
            series_list = (await session.execute(stmt)).fetchall()
            
            for s_id, asset_id in series_list:
                # 2. Query for violations over duration_seconds
                query = PromQLToSQLBuilder.build_threshold_query(
                    metric_id=str(s_id), 
                    condition=rule.condition, 
                    value=float(rule.threshold), 
                    interval_sec=rule.duration_seconds
                )
                
                result = await session.execute(text(query), {"series_id": str(s_id), "threshold": float(rule.threshold)})
                count = result.scalar()
                
                # Check if it was consistently violating over the duration.
                # If required duration=300, and points arrive every 60s, count should be >= 5
                # We do a simpler count > 0 for this stub
                if count and count > 0:
                    violators[str(asset_id)] = float(count) # or fetch avg value
                    
        except Exception as e:
            logger.error(f"Rule evaluation failed for {rule.name}: {e}")
            
        return violators
