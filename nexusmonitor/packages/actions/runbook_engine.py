import logging
from typing import Dict, Any, List
from packages.actions.executor import ActionExecutor

logger = logging.getLogger(__name__)

class RunbookEngine:
    """Executes a sequential DAG of registered actions passing output chains."""
    
    def __init__(self, executor: ActionExecutor):
        self.executor = executor
        
    async def execute_runbook(self, runbook_id: str, steps: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Iterates over task definitions stopping synchronously on failures."""
        logger.info(f"Starting execution of automated runbook DAG: {runbook_id}")
        
        results = []
        for index, step in enumerate(steps):
            action_type = step.get("type", "unknown")
            params = step.get("params", {})
            
            logger.info(f"Runbook {runbook_id} | Step {index + 1}: {action_type}")
            result = await self.executor.execute(action_type, params)
            
            results.append({
                "step": index + 1,
                "action": action_type,
                "result": result.dict()
            })
            
            if not result.success:
                logger.warning(f"Runbook {runbook_id} halted. Step {index + 1} failed: {result.error}")
                # Short-circuit execution natively
                break
                
        # Overall success if all steps succeeded
        all_passed = all(r["result"].get("success", False) for r in results)
        
        return {
            "runbook_id": runbook_id,
            "overall_success": all_passed,
            "step_results": results
        }
