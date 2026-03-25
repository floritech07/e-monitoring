import os
import json
import logging
from typing import List, Optional
try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

class RedisCorrelationStore:
    """Redis-backed distributed state for the CorrelationEngine."""
    
    def __init__(self, url: Optional[str] = None):
        self.url = url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        if REDIS_AVAILABLE:
            self.redis = aioredis.from_url(self.url, decode_responses=True)
            logger.info(f"Connected to Redis for correlation store at {self.url}")
        else:
            self.redis = None
            logger.warning("aioredis not installed; correlation store is offline.")
    
    async def get_group(self, group_key: str) -> List[dict]:
        """Fetches the event group payload from Redis."""
        if not self.redis: return []
        data = await self.redis.get(f"correlation:{group_key}")
        return json.loads(data) if data else []
        
    async def save_group(self, group_key: str, events: List[dict], ttl_seconds: int = 300) -> None:
        """Saves the correlation group with TTL eviction."""
        if not self.redis: return
        await self.redis.setex(
            f"correlation:{group_key}",
            ttl_seconds,
            json.dumps(events)
        )
