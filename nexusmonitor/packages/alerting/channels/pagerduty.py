import httpx
import logging

logger = logging.getLogger(__name__)

async def send_pagerduty_alert(alert, integration_key: str):
    """Sends an incident to PagerDuty Events API v2."""
    payload = {
        "routing_key": integration_key,
        "event_action": "trigger" if alert.state == "FIRING" else "resolve",
        "dedup_key": str(alert.id), # deduplication uses state machine grouping
        "payload": {
            "summary": alert.message,
            "severity": alert.severity.lower() if alert.severity in ["critical", "warning", "info", "error"] else "error",
            "source": f"NexusMonitor Asset: {alert.asset_id}",
            "custom_details": {
                "value": alert.value_at_trigger
            }
        }
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://events.pagerduty.com/v2/enqueue", json=payload, timeout=5.0)
            resp.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to dispatch PagerDuty event: {e}")
