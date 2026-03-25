from datetime import datetime, timezone
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from packages.db.models.alert import Alert, AlertRule
from packages.alerting.deduplication import DeduplicationEngine
from packages.alerting.correlation import CorrelationEngine
from packages.alerting.dispatcher import NotificationDispatcher

logger = logging.getLogger(__name__)

class AlertStateMachine:
    def __init__(self):
        self.dedup = DeduplicationEngine()
        self.correlation = CorrelationEngine()
        self.dispatcher = NotificationDispatcher()

    async def process_violation(self, session: AsyncSession, rule: AlertRule, asset_id: str, value: float):
        """
        Transitions alert state: None -> PENDING -> FIRING
        """
        now = datetime.now(timezone.utc)
        
        # Check if already active
        stmt = select(Alert).where(Alert.rule_id == rule.id, Alert.asset_id == asset_id, Alert.state.in_(["PENDING", "FIRING", "SILENCED"]))
        existing_alert = (await session.execute(stmt)).scalars().first()
        
        if existing_alert:
            if existing_alert.state == "PENDING":
                # Check if duration satisfied
                # A real Pending state relies on a 'first_violation_at' field. 
                # We'll use created_at to trigger FIRING
                time_in_pending = (now - existing_alert.created_at).total_seconds()
                if time_in_pending >= rule.duration_seconds:
                    existing_alert.state = "FIRING"
                    existing_alert.fired_at = now
                    existing_alert.value_at_trigger = str(value)
                    
                    # Dedup / Correlate
                    if not await self.correlation.is_correlated(session, asset_id):
                        await self.dispatcher.dispatch(session, existing_alert)
                    else:
                        logger.info(f"Alert {existing_alert.id} suppressed due to correlation.")
            # If already FIRING or SILENCED, just update value/timestamp via Dedup
            elif existing_alert.state == "FIRING":
                await self.dedup.increment_occurrence(session, existing_alert)
        else:
            # Create NEW pending alert
            new_alert = Alert(
                rule_id=rule.id,
                asset_id=asset_id,
                severity=rule.severity,
                state="PENDING" if rule.duration_seconds > 0 else "FIRING",
                # PENDING if we have a duration check, FIRING if immediate
                message=f"Rule {rule.name} violated (metric: {rule.metric_expression} {rule.condition} {rule.threshold}, val: {value})",
                value_at_trigger=str(value)
            )
            if new_alert.state == "FIRING":
                new_alert.fired_at = now
            session.add(new_alert)
            # In a real pipeline, we commit here and dispatch off a separate queue

    async def resolve_alert(self, session: AsyncSession, alert: Alert):
        """Transitions alert to RESOLVED if it was FIRING/PENDING."""
        alert.state = "RESOLVED"
        alert.resolved_at = datetime.now(timezone.utc)
        logger.info(f"Alert {alert.id} RESOLVED.")
        await self.dispatcher.dispatch(session, alert, is_resolution=True)
