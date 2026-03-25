from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from apps.api.auth.dependencies import require_role
from apps.api.actions.schemas import ActionRequest, ActionResponse
from packages.actions.executor import ActionExecutor

import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/actions", tags=["actions", "automation"])

# In a real app, this is injected via FastAPI depends mapping Singleton
executor_instance = ActionExecutor()

@router.post("/execute", response_model=ActionResponse)
async def trigger_action(req: ActionRequest, user=Depends(require_role("SITE_ADMIN"))):
    """
    Submits an ad-hoc command or action implementation (e.g., SSH, WMI, vSphere) 
    against a target device. Strictly requires SITE_ADMIN/SUPER_ADMIN role natively.
    """
    logger.info(f"User {user} authorized. Triggering manual action {req.action_type}")
    
    # We execute natively here in the REST thread, but usually pushed to Celery Worker
    result = await executor_instance.execute(req.action_type, req.params)
    
    return ActionResponse(
        action_type=req.action_type,
        success=result.success,
        output=result.output,
        error=result.error,
        execution_time_ms=result.execution_time_ms
    )
    
@router.post("/runbook/{runbook_id}/start")
async def start_runbook(runbook_id: str, user=Depends(require_role("SITE_ADMIN"))):
    """Triggers an existing multi-step automation sequence."""
    return {"message": "Runbook queued to Worker thread", "runbook_id": runbook_id}
