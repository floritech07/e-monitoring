import httpx
import logging

logger = logging.getLogger(__name__)

async def send_slack_alert(alert, webhook_url: str):
    """Sends a formatted message to Slack/Teams incoming webhook endpoint."""
    
    color = "#FF0000" if alert.severity == "CRITICAL" else "#FFA500" if alert.severity == "HIGH" else "#008000"
    
    payload = {
        "attachments": [
            {
                "fallback": f"[{alert.severity}] {alert.message}",
                "color": color,
                "title": f"Alert: {alert.severity}",
                "text": str(alert.message),
                "fields": [
                    {
                        "title": "Asset ID",
                        "value": str(alert.asset_id),
                        "short": True
                    },
                    {
                        "title": "Value",
                        "value": str(alert.value_at_trigger),
                        "short": True
                    }
                ],
                "footer": "NexusMonitor Automation"
            }
        ]
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(webhook_url, json=payload, timeout=5.0)
            resp.raise_for_status()
            logger.info("Slack webhook dispatched successfully")
    except Exception as e:
        logger.error(f"Failed to dispatch Slack webhook: {e}")
