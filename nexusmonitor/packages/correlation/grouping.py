from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class AlertGrouper:
    """
    Maintains a live dictionary of alert groups by composite fingerprint key.
    Exposes methods for querying active problem clusters with severity rollup.
    """
    
    def __init__(self):
        self.groups: Dict[str, List[dict]] = {}
        
    def add(self, group_key: str, event: dict):
        if group_key not in self.groups:
            self.groups[group_key] = []
        self.groups[group_key].append(event)
        
    def get_group(self, group_key: str) -> List[dict]:
        return self.groups.get(group_key, [])
        
    def get_all_groups(self) -> Dict[str, Any]:
        result = {}
        for key, events in self.groups.items():
            severities = [e.get("severity", "INFO") for e in events]
            # Roll up worst severity in the cluster
            worst = "INFO"
            for sev in ["CRITICAL", "HIGH", "WARNING", "INFO"]:
                if sev in severities:
                    worst = sev
                    break
            result[key] = {
                "count": len(events),
                "worst_severity": worst,
                "events": events
            }
        return result
        
    def clear_group(self, group_key: str):
        self.groups.pop(group_key, None)
