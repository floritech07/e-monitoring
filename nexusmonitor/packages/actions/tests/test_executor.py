import pytest
from packages.actions.executor import ActionExecutor, BaseActionImplementation, ActionResult

class MockPassingAction(BaseActionImplementation):
    async def execute(self, params):
        if "fail_me" in params:
            return ActionResult(success=False, output="", error="I failed")
        return ActionResult(success=True, output="Mock Output Success!")

@pytest.mark.asyncio
async def test_action_executor_resolution():
    engine = ActionExecutor()
    engine.register("mock_action", MockPassingAction)
    
    res = await engine.execute("mock_action", {"key": "value"})
    assert res.success is True
    assert res.output == "Mock Output Success!"
    assert res.execution_time_ms >= 0

@pytest.mark.asyncio
async def test_action_executor_missing():
    engine = ActionExecutor()
    res = await engine.execute("unknown", {})
    assert res.success is False
    assert "missing" in res.error

@pytest.mark.asyncio
async def test_action_executor_sandbox_catch():
    from packages.actions.sandbox import ActionSandbox
    # Validate command tokens mapping logic directly
    assert ActionSandbox.validate_command("ls -la") is True
    assert ActionSandbox.validate_command("rm -rf /") is False
    assert ActionSandbox.validate_command("cat /tmp/x | sh") is False
