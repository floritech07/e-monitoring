import logging
import asyncio
from typing import List, Dict, Any
from datetime import datetime, timedelta
from packages.correlation.store import RedisCorrelationStore

logger = logging.getLogger(__name__)

class CorrelationEngine:
    """
    Event Correlation Engine performing rule-based grouping, temporal windowing,
    deduplication, and priority scoring across incoming alert streams.
    State is distributed via Redis for multi-worker consistency.
    """
    
    def __init__(self, window_seconds: int = 300):
        self.window_seconds = window_seconds
        # FIX-004: Redis-backed state replaces self.active_groups
        self.store = RedisCorrelationStore()
        
    async def ingest_event(self, event: dict) -> dict:
        """
        Receives an incoming alert payload and determines if it belongs to an 
        existing correlation group, or spawns a new root problem node.
        """
        key = self._compute_group_key(event)
        now = datetime.utcnow()
        expiry = now - timedelta(seconds=self.window_seconds)

        # Retrieve current group from Redis
        group_events = await self.store.get_group(key)

        # Evict expired events from windows natively
        group_events = [
            e for e in group_events
            if datetime.fromisoformat(e["timestamp"]) > expiry
        ]

        # Check for exact duplicate within window
        if self._is_duplicate(event, group_events):
            logger.debug(f"Suppressed duplicate event: {event.get('title')}")
            return {"action": "deduplicated", "group_key": key}

        group_events.append({
            **event,
            "timestamp": event.get("timestamp", now.isoformat())
        })
        
        # Save updated group back to Redis with TTL
        await self.store.save_group(key, group_events, self.window_seconds)
        
        score = self._compute_priority_score(group_events)
        
        return {
            "action": "correlated",
            "group_key": key,
            "group_size": len(group_events),
            "priority_score": score
        }

    def _compute_group_key(self, event: dict) -> str:
        """Derives grouping fingerprint from asset+category combination."""
        asset_id = event.get("asset_id", "unknown")
        category = event.get("category", "generic")
        return f"{asset_id}::{category}"

    def _is_duplicate(self, event: dict, bucket: List[dict]) -> bool:
        """Strict string equality check on title within temporal window."""
        title = event.get("title", "")
        return any(e.get("title") == title for e in bucket)

    def _compute_priority_score(self, bucket: List[dict]) -> float:
        """Boosts severity score proportionally with event count in window."""
        severity_map = {"CRITICAL": 10, "HIGH": 7, "WARNING": 4, "INFO": 1}
        base_score = sum(severity_map.get(e.get("severity", "INFO"), 1) for e in bucket)
        # Multiplicative boost for correlated cluster size
        return round(base_score * (1 + 0.1 * len(bucket)), 2)
