import pytest
from packages.actions.auto_remediation import AutoRemediationPolicy

class MockRunbookEngine:
    def __init__(self):
        self.fired_runbooks = []
        
    async def execute_runbook(self, rb_id, steps):
        self.fired_runbooks.append(rb_id)

@pytest.mark.asyncio
async def test_auto_remediation_triggers_mapping():
    engine = MockRunbookEngine()
    policy = AutoRemediationPolicy(engine)
    
    # Matching strict strings defined in remediation logic
    fired = await policy.bind_alert_to_solution("alert_123", "Warning: Disk 95% Full on C:", "asset_1")
    assert fired is True
    assert "RUNBOOK_AUTO_CLEANUP" in engine.fired_runbooks
    
    # Non matching should be ignored cleanly
    engine.fired_runbooks = []
    fired = await policy.bind_alert_to_solution("alert_456", "High CPU Usage", "asset_1")
    assert fired is False
    assert len(engine.fired_runbooks) == 0
