import httpx
import logging
import os

logger = logging.getLogger(__name__)

async def send_sms_alert(alert, to_number: str):
    """Sends SMS using Twilio API as an example interface."""
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_num = os.getenv("TWILIO_FROM_NUMBER")
    
    if not sid or not token:
        logger.warning("Twilio credentials missing, skipping SMS dispatch.")
        return
        
    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    data = {
        "To": to_number,
        "From": from_num,
        "Body": f"NexusMonitor [{alert.severity}]: {alert.message} (Asset: {alert.asset_id})"
    }
    try:
        async with httpx.AsyncClient() as client:
            # Twilio uses Basic Auth
            resp = await client.post(url, data=data, auth=(sid, token), timeout=5.0)
            resp.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to send SMS via Twilio: {e}")
