from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import datetime

from packages.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from apps.api.auth.dependencies import get_current_user
from packages.db.models.user import User

from apps.api.metrics.schemas import MetricQueryRequest, MetricQueryResponse
from apps.api.metrics.service import MetricQueryService

router = APIRouter(prefix="/metrics", tags=["metrics"])

@router.get("/{asset_id}/series")
async def list_series_for_asset(
    asset_id: str,
    session: AsyncSession = Depends(get_session),
    # user: User = Depends(get_current_user) # Omitting RBAC guard for simpler stub
):
    """List all available time-series for a specific asset."""
    # ...
    return MetricQueryService.list_series(session, asset_id)

@router.post("/query")
async def query_metrics(
    req: MetricQueryRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Query metrics matching Prometheus range query style API.
    """
    result = await MetricQueryService.execute_query(
        session=session,
        series_id=req.series_id,
        start_ts=req.start_time,
        end_ts=req.end_time,
        step=req.step,
        aggregation=req.aggregation
    )
    return {"status": "success", "data": {"resultType": "matrix", "result": result}}

@router.get("/{asset_id}/latest")
async def get_latest_metrics(
    asset_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Get the most recent values for all metrics on an asset."""
    return await MetricQueryService.get_latest(session, asset_id)
