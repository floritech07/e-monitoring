from celery import Celery
import logging
import os
import asyncio

logger = logging.getLogger(__name__)

celery_app = Celery('nexusmonitor', broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

@celery_app.task(name='tasks.ml_training.train_anomaly_model')
def train_anomaly_model(asset_id: str, metric_key: str, history: list):
    """
    Background task training an IsolationForest model on historical metric data.
    In production, serializes trained model to MinIO/S3 via packages/ml/model_store.
    """
    from packages.ml.anomaly import AnomalyDetector

    logger.info(f"[ML TRAIN] Starting anomaly model for {asset_id}:{metric_key} ({len(history)} pts)")
    detector = AnomalyDetector(contamination=0.05)
    detector.train(history)

    return {
        "asset_id": asset_id,
        "metric_key": metric_key,
        "trained": detector.trained,
        "samples": len(history)
    }

@celery_app.task(name='tasks.ml_training.run_capacity_forecast')
def run_capacity_forecast(asset_id: str, metric_key: str, timestamps: list, values: list, threshold: float = 90.0):
    """Background task running capacity saturation forecast and alerting if ETA is within 72 hours."""
    from packages.ml.forecast import CapacityForecaster

    logger.info(f"[ML FORECAST] Running for {asset_id}:{metric_key}")
    forecaster = CapacityForecaster()
    forecast = forecaster.forecast(timestamps, values, periods=24)
    eta = forecaster.estimate_saturation(values, threshold)

    if eta > 0 and eta < 72:
        logger.warning(f"[ML FORECAST] CAPACITY ALERT — {asset_id}:{metric_key} saturates in {eta}h!")

    return {"asset_id": asset_id, "eta_hours": eta, "forecast_points": len(forecast)}
