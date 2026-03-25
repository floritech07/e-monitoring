import httpx
import logging

logger = logging.getLogger(__name__)

async def send_teams_alert(alert, webhook_url: str):
    """Sends a Microsoft Teams Adaptive Card alert."""
    color = "FF0000" if alert.severity == "CRITICAL" else "FFA500" if alert.severity == "HIGH" else "008000"
    payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": color,
        "summary": alert.message,
        "sections": [{
            "activityTitle": f"[{alert.severity}] Alert Triggered",
            "text": alert.message,
            "facts": [
                {"name": "Asset", "value": str(alert.asset_id)},
                {"name": "Value", "value": str(alert.value_at_trigger)}
            ]
        }]
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(webhook_url, json=payload, timeout=5.0)
            resp.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to dispatch Teams webhook: {e}")
