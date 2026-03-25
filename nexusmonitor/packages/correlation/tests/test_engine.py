import pytest
from packages.correlation.engine import CorrelationEngine
from packages.correlation.grouping import AlertGrouper
from packages.correlation.patterns import PatternDetector
from packages.correlation.rules import evaluate_rules

def make_event(title="Disk 90% Full", severity="WARNING", category="STORAGE", asset_id="a1"):
    return {"title": title, "severity": severity, "category": category, "asset_id": asset_id,
            "state": "FIRING", "site_id": "site1"}

def test_correlation_engine_groups_same_asset_category():
    engine = CorrelationEngine(window_seconds=60)
    e1 = make_event("CPU High", "HIGH", "HOST", "srv1")
    e2 = make_event("Memory Pressure", "HIGH", "HOST", "srv1")
    
    r1 = engine.ingest_event(e1)
    r2 = engine.ingest_event(e2)
    
    assert r1["action"] == "correlated"
    assert r2["action"] == "correlated"
    assert r1["group_key"] == r2["group_key"]
    assert r2["group_size"] == 2

def test_correlation_engine_deduplicates():
    engine = CorrelationEngine(window_seconds=60)
    event = make_event("Disk Full")
    engine.ingest_event(event)
    result = engine.ingest_event(event) # Exact same
    assert result["action"] == "deduplicated"

def test_priority_score_escalates_with_size():
    engine = CorrelationEngine(window_seconds=60)
    events = [make_event(f"Alert {i}", "CRITICAL", "HOST", "srv1") for i in range(5)]
    results = [engine.ingest_event(e) for e in events]
    last = results[-1]
    assert last["priority_score"] > results[0]["priority_score"]

def test_pattern_detector_flapping():
    detector = PatternDetector()
    events = [
        {"state": "FIRING"}, {"state": "RESOLVED"},
        {"state": "FIRING"}, {"state": "RESOLVED"}
    ]
    assert detector.detect_flapping(events, toggle_threshold=4) is True

def test_rule_matching():
    event = {"category": "STORAGE", "severity": "CRITICAL", "asset_id": "disk1"}
    matched = evaluate_rules(event)
    assert "RULE-002" in matched

def test_grouper_rollup():
    g = AlertGrouper()
    g.add("k1", {"severity": "WARNING"})
    g.add("k1", {"severity": "CRITICAL"})
    groups = g.get_all_groups()
    assert groups["k1"]["worst_severity"] == "CRITICAL"
    assert groups["k1"]["count"] == 2
