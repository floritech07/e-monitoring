import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from packages.db.models.alert import AlertRule, Alert
from packages.db.engine import db_manager
from packages.alerting.expression_evaluator import ExpressionEvaluator
from packages.alerting.state_machine import AlertStateMachine

logger = logging.getLogger(__name__)

class AlertRuleEngine:
    """Evaluates all active alert rules on a schedule."""
    
    def __init__(self):
        self.evaluator = ExpressionEvaluator()
        self.state_machine = AlertStateMachine()
        
    async def evaluate_all(self):
        """Main loop called by a Celery beat task or async loop every 30s."""
        async with db_manager.get_session() as session:
            # Fetch all rules
            rules = (await session.execute(select(AlertRule))).scalars().all()
            for rule in rules:
                try:
                    await self.evaluate_rule(session, rule)
                except Exception as e:
                    logger.error(f"Error evaluating rule {rule.name} ({rule.id}): {e}")
                    
    async def evaluate_rule(self, session: AsyncSession, rule: AlertRule):
        """Evaluates a single rule using PromQL-like expression execution."""
        # Find which assets the expression returned a violation for
        # E.g. {"asset_id_string": violation_value}
        violations = await self.evaluator.evaluate(session, rule)
        
        # State machine handles state transitions
        # Fire new alerts
        for asset_id, val in violations.items():
            await self.state_machine.process_violation(session, rule, asset_id, val)
            
        # Also need to resolve alerts for assets that no longer violate the rule
        # Find currently FIRING/PENDING alerts for this rule that are NOT in violations
        existing_alerts = (await session.execute(
            select(Alert).where(
                Alert.rule_id == rule.id,
                Alert.state.in_(["FIRING", "PENDING"])
            )
        )).scalars().all()
        
        for alert in existing_alerts:
            if str(alert.asset_id) not in violations:
                await self.state_machine.resolve_alert(session, alert)
