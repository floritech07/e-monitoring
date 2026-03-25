import logging
from typing import Dict, Any, Type
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class ActionResult(BaseModel):
    success: bool
    output: str
    error: str | None = None
    execution_time_ms: float = 0.0

class BaseActionImplementation:
    """Base interface for actionable automations (SSH, WMI, vSphere)."""
    async def execute(self, params: Dict[str, Any]) -> ActionResult:
        raise NotImplementedError("Actions must implement execution natively")

class ActionExecutor:
    """
    Central dispatcher coordinating remote executions across heterogeneous systems.
    Resolves targets, authenticates, and routes to appropriate protocol implementations.
    """
    
    def __init__(self):
        self.registry: Dict[str, Type[BaseActionImplementation]] = {}
        
    def register(self, action_type: str, impl_class: Type[BaseActionImplementation]):
        self.registry[action_type] = impl_class
        
    async def execute(self, action_type: str, params: Dict[str, Any]) -> ActionResult:
        """Invokes registered action via sandbox boundaries."""
        if action_type not in self.registry:
            logger.error(f"Action '{action_type}' not found in executable registry")
            return ActionResult(success=False, output="", error="Action implementation missing")
            
        instance = self.registry[action_type]()
        logger.info(f"Executing action {action_type} with parameters {params.keys()}")
        
        try:
            # Typically wrapped via a Sandbox or Timeout policy here
            import time
            start = time.time()
            result = await instance.execute(params)
            result.execution_time_ms = (time.time() - start) * 1000
            return result
        except Exception as e:
            logger.error(f"Action execution failure: {e}")
            return ActionResult(success=False, output="", error=str(e))
