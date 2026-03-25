from fastapi import APIRouter, Depends
from packages.ml.pipeline import MLPipeline
from apps.api.auth.dependencies import require_role
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/ml", tags=["ml", "anomaly", "forecast"])

pipeline = MLPipeline()

class AnomalyRequest(BaseModel):
    asset_id: str
    metric_key: str
    history: List[float]
    current_window: List[float]

class ForecastRequest(BaseModel):
    asset_id: str
    metric_key: str
    timestamps: List[str]
    values: List[float]
    threshold: float = 90.0
    periods: int = 24

@router.post("/anomaly/detect")
async def detect_anomaly(req: AnomalyRequest, user=Depends(require_role("VIEWER"))):
    """Runs IsolationForest anomaly detection on submitted metric window."""
    return await pipeline.run_anomaly_scan(req.asset_id, req.metric_key, req.history, req.current_window)

@router.post("/forecast/capacity")
async def forecast_capacity(req: ForecastRequest, user=Depends(require_role("VIEWER"))):
    """Generates capacity saturation forecast with ETA estimation."""
    return await pipeline.run_capacity_forecast(
        req.asset_id, req.metric_key, req.timestamps, req.values, req.threshold, req.periods
    )
