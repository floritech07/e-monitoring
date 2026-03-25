import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class CorrelationEngine:
    """
    Event Correlation Engine performing rule-based grouping, temporal windowing,
    deduplication, and priority scoring across incoming alert streams.
    """
    
    def __init__(self, window_seconds: int = 300):
        self.window_seconds = window_seconds
        self.active_groups: Dict[str, List[dict]] = {}
        
    def ingest_event(self, event: dict) -> dict:
        """
        Receives an incoming alert payload and determines if it belongs to an 
        existing correlation group, or spawns a new root problem node.
        """
        key = self._compute_group_key(event)
        now = datetime.utcnow()
        expiry = now - timedelta(seconds=self.window_seconds)

        # Evict expired events from windows natively
        if key in self.active_groups:
            self.active_groups[key] = [
                e for e in self.active_groups[key]
                if datetime.fromisoformat(e["timestamp"]) > expiry
            ]

        if key not in self.active_groups:
            self.active_groups[key] = []

        # Check for exact duplicate within window
        if self._is_duplicate(event, self.active_groups[key]):
            logger.debug(f"Suppressed duplicate event: {event.get('title')}")
            return {"action": "deduplicated", "group_key": key}

        self.active_groups[key].append({
            **event,
            "timestamp": event.get("timestamp", now.isoformat())
        })
        
        score = self._compute_priority_score(self.active_groups[key])
        
        return {
            "action": "correlated",
            "group_key": key,
            "group_size": len(self.active_groups[key]),
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
