from dataclasses import dataclass, field
from typing import Callable, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

@dataclass
class CorrelationRule:
    """Declarative rule matching alert streams to correlated problem nodes."""
    id: str
    name: str
    description: str
    matcher: Callable[[dict], bool]
    group_key_fn: Callable[[dict], str]
    priority_boost: float = 1.0

# A registry of production rules
RULE_REGISTRY: List[CorrelationRule] = [
    CorrelationRule(
        id="RULE-001",
        name="Network Device Failure Cascade",
        description="Correlates multiple device DOWN events on the same network segment",
        matcher=lambda e: e.get("category") == "NETWORK" and "down" in e.get("title", "").lower(),
        group_key_fn=lambda e: f"net-cascade::{e.get('site_id', 'unknown')}",
        priority_boost=2.5
    ),
    CorrelationRule(
        id="RULE-002",
        name="Storage Subsystem Pressure",
        description="Groups disk-full, I/O latency, and storage errors per host",
        matcher=lambda e: e.get("category") == "STORAGE",
        group_key_fn=lambda e: f"storage::{e.get('asset_id', 'unknown')}",
        priority_boost=1.8
    ),
    CorrelationRule(
        id="RULE-003",
        name="Host Multi-Resource Critical",
        description="Correlates simultaneous CPU + Memory + Disk pressure on a single server",
        matcher=lambda e: e.get("category") == "HOST" and e.get("severity") in ["CRITICAL", "HIGH"],
        group_key_fn=lambda e: f"host-stress::{e.get('asset_id')}",
        priority_boost=3.0
    ),
]

def evaluate_rules(event: dict) -> List[str]:
    """Returns list of matching rule IDs for an incoming event."""
    matched = []
    for rule in RULE_REGISTRY:
        try:
            if rule.matcher(event):
                matched.append(rule.id)
        except Exception as e:
            logger.error(f"Rule {rule.id} evaluation error: {e}")
    return matched
