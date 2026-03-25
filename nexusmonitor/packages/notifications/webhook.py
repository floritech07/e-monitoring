import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

class WebhookNotifier:
    """Sends structured JSON payloads to arbitrary HTTP webhook endpoints."""
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=30))
    async def send(self, url: str, payload: dict, secret: str = None) -> bool:
        headers = {"Content-Type": "application/json"}
        if secret:
            import hmac, hashlib, json
            body = json.dumps(payload).encode()
            sig = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
            headers["X-NexusMonitor-Signature"] = f"sha256={sig}"
            
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                logger.info(f"Webhook delivered to {url} → HTTP {resp.status_code}")
                return True
        except httpx.HTTPError as e:
            logger.error(f"Webhook delivery failed to {url}: {e}")
            raise # Tenacity will retry
