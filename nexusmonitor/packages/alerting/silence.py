from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone
import logging

from packages.db.models.alert import Alert

logger = logging.getLogger(__name__)

class SilenceManager:
    async def get_active_silences(self, session: AsyncSession, asset_id: str, rule_id: str = None) -> list:
        """
        Check if an active MaintenanceWindow or manual Silence covers this alert.
        In this stub, we return an empty list or mock response.
        """
        return []

    async def apply_silence(self, session: AsyncSession, alert_id: str, duration_minutes: int, comment: str = None):
        """Silences an active alert by changing its state and setting an expiration."""
        alert = await session.get(Alert, alert_id)
        if alert and alert.state in ["FIRING", "PENDING"]:
            alert.state = "SILENCED"
            # In real MCD, store silence metadata in a related table or JSON metadata
            alert.message += f" [SILENCED for {duration_minutes}m: {comment}]"
            await session.commit()
            logger.info(f"Alert {alert_id} silenced for {duration_minutes}m")
            return True
        return False
