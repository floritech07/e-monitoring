from celery import shared_task
import redis
import json
import os
import logging
from apps.api.websocket.events import create_redis_channel

logger = logging.getLogger(__name__)

# Synchronous redis client for celery workers
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

@shared_task(name="events.publish")
def publish_event(org_id: str, event_type: str, payload_json: str):
    """
    Called by backend services to push real-time events to the WS hub via Redis.
    """
    channel = create_redis_channel(org_id, event_type)
    try:
        redis_client.publish(channel, payload_json)
    except Exception as e:
        logger.error(f"Failed publishing to {channel}: {e}")
