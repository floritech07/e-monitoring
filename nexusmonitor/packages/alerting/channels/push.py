import httpx
import logging
import os

logger = logging.getLogger(__name__)

async def send_fcm_push_alert(alert, device_token: str):
    """Sends Push Notification via Firebase Cloud Messaging."""
    server_key = os.getenv("FCM_SERVER_KEY")
    if not server_key:
        logger.warning("FCM key missing.")
        return

    url = "https://fcm.googleapis.com/fcm/send"
    headers = {"Authorization": f"key={server_key}", "Content-Type": "application/json"}
    payload = {
        "to": device_token,
        "notification": {
            "title": f"NexusMonitor {alert.severity}",
            "body": alert.message
        },
        "data": {
            "alert_id": str(alert.id),
            "asset_id": str(alert.asset_id)
        }
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=payload, timeout=5.0)
            resp.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")
