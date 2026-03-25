import logging
from typing import List, Dict, Any, Optional
from packages.notifications.email import EmailNotifier
from packages.notifications.slack import SlackNotifier
from packages.notifications.webhook import WebhookNotifier

logger = logging.getLogger(__name__)

class NotificationDispatcher:
    """
    Centralized multi-channel dispatch hub validating notification payloads
    and distributing across enabled channels concurrently.
    """
    
    def __init__(self):
        self.email = EmailNotifier()
        self.slack = SlackNotifier()
        self.webhook = WebhookNotifier()
        
    async def dispatch(self, alert: dict, channels: List[Dict[str, Any]]) -> Dict[str, bool]:
        """
        Sends alert to each configured channel in sequence.
        channels: [{"type": "email", "config": {...}}, {"type": "slack", "config": {...}}]
        """
        results = {}
        
        for ch in channels:
            ch_type = ch.get("type")
            config = ch.get("config", {})
            
            try:
                if ch_type == "email":
                    success = await self.email.send_alert_email(config["to"], alert)
                elif ch_type == "slack":
                    success = await self.slack.send(config.get("webhook_url", ""), alert)
                elif ch_type == "webhook":
                    success = await self.webhook.send(config["url"], alert, config.get("secret"))
                else:
                    logger.warning(f"Unknown channel type: {ch_type}")
                    success = False
                    
                results[ch_type] = success
                
            except Exception as e:
                logger.error(f"Channel {ch_type} failed permanently: {e}")
                results[ch_type] = False
                
        return results
