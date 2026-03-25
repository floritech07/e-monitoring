from fastapi import APIRouter, Depends, BackgroundTasks
from apps.api.notifications.schemas import NotificationTestRequest, NotificationTestResponse
from packages.notifications.dispatcher import NotificationDispatcher
from apps.api.auth.dependencies import require_role

router = APIRouter(prefix="/notifications", tags=["notifications"])

dispatcher = NotificationDispatcher()

@router.post("/test", response_model=NotificationTestResponse)
async def test_notification(
    req: NotificationTestRequest,
    background_tasks: BackgroundTasks,
    user=Depends(require_role("SITE_ADMIN"))
):
    """Sends a test notification through specified channels to verify channel health."""
    test_alert = {
        "title": "NexusMonitor Test Alert",
        "message": "This is a connectivity test from NexusMonitor.",
        "severity": "INFO",
        "asset_id": "test-asset",
        "site_id": "test-site"
    }
    results = await dispatcher.dispatch(test_alert, req.channels)
    return NotificationTestResponse(results=results)
    
@router.get("/channels")
async def list_channels(user=Depends(require_role("VIEWER"))):
    """Returns supported notification channel types."""
    return {"supported_channels": ["email", "slack", "teams", "pagerduty", "webhook", "sms", "push"]}
