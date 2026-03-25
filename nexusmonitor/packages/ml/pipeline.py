import logging
import asyncio
from typing import List, Dict, Any
from packages.ml.anomaly import AnomalyDetector
from packages.ml.forecast import CapacityForecaster

logger = logging.getLogger(__name__)

class MLPipeline:
    """
    Unified orchestration pipeline for:
     1. Anomaly detection (IsolationForest)
     2. Capacity forecasting (Prophet / linear)
     3. Alert generation for detected anomalies
    """

    def __init__(self):
        self.detector = AnomalyDetector(contamination=0.05)
        self.forecaster = CapacityForecaster()

    async def run_anomaly_scan(
        self, asset_id: str, metric_key: str, history: List[float], current_window: List[float]
    ) -> Dict[str, Any]:
        """Trains on historical data and predicts anomalies in the current window."""
        loop = asyncio.get_event_loop()

        # I/O-free CPU-bound work; offloaded to executor for async compat
        await loop.run_in_executor(None, self.detector.train, history)
        results = await loop.run_in_executor(None, self.detector.predict, current_window)

        anomalies = [r for r in results if r["is_anomaly"]]
        logger.info(f"[ML] {asset_id}:{metric_key} — {len(anomalies)} anomalies in {len(current_window)} points")

        return {
            "asset_id": asset_id,
            "metric_key": metric_key,
            "anomaly_count": len(anomalies),
            "anomalies": anomalies,
            "all_results": results,
        }

    async def run_capacity_forecast(
        self, asset_id: str, metric_key: str,
        timestamps: List[str], values: List[float],
        threshold: float = 90.0, periods: int = 24
    ) -> Dict[str, Any]:
        """Generates horizon forecasts and estimates saturation time."""
        loop = asyncio.get_event_loop()

        forecast = await loop.run_in_executor(
            None, self.forecaster.forecast, timestamps, values, periods
        )
        eta_hours = self.forecaster.estimate_saturation(values, threshold)

        return {
            "asset_id": asset_id,
            "metric_key": metric_key,
            "forecast_periods": periods,
            "forecast": forecast,
            "saturation_threshold": threshold,
            "eta_hours_to_saturation": eta_hours,
            "critical_warning": eta_hours > 0 and eta_hours < 72,
        }
