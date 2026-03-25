import pytest
from packages.actions.runbook_engine import RunbookEngine
from packages.actions.executor import ActionExecutor, BaseActionImplementation, ActionResult

class StepAction(BaseActionImplementation):
    async def execute(self, params):
        if params.get("will_fail"):
            return ActionResult(success=False, output="", error="Step Failed Intentionally")
        return ActionResult(success=True, output=f"Step {params.get('id')} OK")

@pytest.mark.asyncio
async def test_runbook_sequential_success():
    ex = ActionExecutor()
    ex.register("step_test", StepAction)
    engine = RunbookEngine(ex)
    
    steps = [
        {"type": "step_test", "params": {"id": 1}},
        {"type": "step_test", "params": {"id": 2}}
    ]
    
    result = await engine.execute_runbook("TEST_RUN", steps)
    assert result["overall_success"] is True
    assert len(result["step_results"]) == 2

@pytest.mark.asyncio
async def test_runbook_halts_on_failure():
    ex = ActionExecutor()
    ex.register("step_test", StepAction)
    engine = RunbookEngine(ex)
    
    steps = [
        {"type": "step_test", "params": {"id": 1}},
        {"type": "step_test", "params": {"id": 2, "will_fail": True}},
        {"type": "step_test", "params": {"id": 3}} # Should not process
    ]
    
    result = await engine.execute_runbook("TEST_FAIL", steps)
    assert result["overall_success"] is False
    # Verified it short circuits at Step 2
    assert len(result["step_results"]) == 2
