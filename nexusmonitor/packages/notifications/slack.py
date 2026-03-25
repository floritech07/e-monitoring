import logging
import httpx
import os
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")

class SlackNotifier:
    """Posts structured Block Kit messages to Slack channels via Incoming Webhooks."""
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def send(self, channel_url: str, alert: dict) -> bool:
        severity = alert.get("severity", "INFO")
        color_map = {"CRITICAL": "#FF0000", "HIGH": "#FF6600", "WARNING": "#FFD700", "INFO": "#36A64F"}
        
        payload = {
            "attachments": [
                {
                    "color": color_map.get(severity, "#888888"),
                    "title": f"[{severity}] {alert.get('title', 'Alert')}",
                    "text": alert.get("message", ""),
                    "footer": "NexusMonitor Enterprise",
                    "fields": [
                        {"title": "Asset", "value": alert.get("asset_id", "Unknown"), "short": True},
                        {"title": "Site", "value": alert.get("site_id", "Unknown"), "short": True},
                    ]
                }
            ]
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(channel_url or SLACK_WEBHOOK_URL, json=payload)
            if resp.status_code != 200:
                logger.error(f"Slack returned HTTP {resp.status_code}: {resp.text}")
                return False
                
        logger.info(f"Slack notification sent for {alert.get('title')}")
        return True
