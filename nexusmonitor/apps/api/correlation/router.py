from fastapi import APIRouter, Depends
from apps.api.correlation.schemas import CorrelationEventIn, CorrelationResult
from packages.correlation.engine import CorrelationEngine
from packages.correlation.grouping import AlertGrouper
from apps.api.auth.dependencies import require_role

router = APIRouter(prefix="/correlation", tags=["correlation"])

engine = CorrelationEngine(window_seconds=300)
grouper = AlertGrouper()

@router.post("/ingest", response_model=CorrelationResult)
async def ingest_event(event: CorrelationEventIn, user=Depends(require_role("VIEWER"))):
    """Ingests an alert event through the correlation engine and returns grouping decisions."""
    result = engine.ingest_event(event.dict())
    if result["action"] == "correlated":
        grouper.add(result["group_key"], event.dict())
    return CorrelationResult(**result)

@router.get("/groups")
async def get_active_groups(user=Depends(require_role("VIEWER"))):
    """Returns all active problem correlation groups with severity rollup."""
    return grouper.get_all_groups()
