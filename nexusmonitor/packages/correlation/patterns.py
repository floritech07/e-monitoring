from typing import List, Dict
import re
import logging

logger = logging.getLogger(__name__)

class PatternDetector:
    """
    Pattern-based detection on event sequences looking for known problem signatures
    such as oscillating alerts (flapping), exponential event growth, and silence-then-storm patterns.
    """
    
    def detect_flapping(self, events: List[dict], toggle_threshold: int = 4) -> bool:
        """Detects rapid state changes on a single asset within the corr window."""
        if len(events) < toggle_threshold:
            return False
        statuses = [e.get("state", "") for e in events]
        toggles = sum(1 for i in range(1, len(statuses)) if statuses[i] != statuses[i-1])
        return toggles >= toggle_threshold - 1

    def detect_storm(self, events: List[dict], burst_threshold: int = 10) -> bool:
        """Detects an event storm: too many events in very short time (default 10+)."""
        return len(events) >= burst_threshold
    
    def detect_pattern(self, title: str, known_patterns: List[str]) -> str | None:
        """Matches alert title against known named problem signatures."""
        for pattern in known_patterns:
            if re.search(pattern, title, re.IGNORECASE):
                return pattern
        return None
