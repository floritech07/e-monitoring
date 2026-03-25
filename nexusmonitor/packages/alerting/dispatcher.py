from sqlalchemy.ext.asyncio import AsyncSession
from packages.db.models.alert import Alert
import logging

logger = logging.getLogger(__name__)

class NotificationDispatcher:
    def __init__(self):
        # We would lazily load channels based on organization settings
        pass
        
    async def dispatch(self, session: AsyncSession, alert: Alert, is_resolution=False):
        """
        Dispatches the alert payload to all configured channels (Email, Slack, Webhooks)
        """
        # Publish to Redis for WebSocket hub to broadcast instantly
        # e.g., redis.publish(f"nm:{alert.organization_id}:alert.fired", alert.json())
        logger.info(f"DISPATCH: Alert {alert.id} ({alert.severity}) - {alert.message} | Resolution: {is_resolution}")
        
        # Async invoke all subscribed channels
        # asyncio.create_task(email_channel.send(alert))
        # asyncio.create_task(slack_channel.send(alert))
        pass
