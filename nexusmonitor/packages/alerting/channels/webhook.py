import httpx
import logging
from packages.db.models.alert import Alert

logger = logging.getLogger(__name__)

async def send_webhook_alert(alert: Alert, url: str):
    """Generic JSON webhook dispatch."""
    payload = alert.to_dict()
    # Serialize datetime/UUID for standard JSON processing
    for k, v in payload.items():
        if v is not None and not isinstance(v, (str, int, float, bool, dict, list)):
            payload[k] = str(v)
            
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=5.0)
            resp.raise_for_status()
    except Exception as e:
        logger.error(f"Failed generic webhook: {e}")
