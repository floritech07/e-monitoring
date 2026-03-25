import pytest
import numpy as np
from packages.ml.anomaly import AnomalyDetector
from packages.ml.forecast import CapacityForecaster
from packages.ml.pipeline import MLPipeline

# ─── AnomalyDetector tests ──────────────────────────────────────────────

def test_detector_trains_on_sufficient_data():
    det = AnomalyDetector(contamination=0.05)
    history = list(np.random.normal(50, 5, 100))
    det.train(history)
    assert det.trained is True
    assert det.model is not None

def test_detector_skips_small_dataset():
    det = AnomalyDetector()
    det.train([1, 2, 3])
    assert det.trained is False

def test_detector_identifies_obvious_spike():
    det = AnomalyDetector(contamination=0.1)
    history = list(np.random.normal(50, 3, 200))
    det.train(history)
    # Inject extreme outlier
    results = det.predict([50.0, 51.0, 99.9, 50.5])
    spike = results[2]
    assert spike["value"] == 99.9
    assert spike["is_anomaly"] is True

def test_detector_normal_values_not_flagged():
    det = AnomalyDetector(contamination=0.05)
    history = list(np.random.normal(50, 2, 200))
    det.train(history)
    results = det.predict([50.0, 50.5, 49.8, 50.2])
    anomalies = [r for r in results if r["is_anomaly"]]
    # Tight normal cluster should produce zero or very few anomalies
    assert len(anomalies) <= 1

def test_z_score_deviation():
    det = AnomalyDetector()
    assert det.detect_deviation(current=100, baseline_mean=50, baseline_std=5, threshold_sigma=3) is True
    assert det.detect_deviation(current=52, baseline_mean=50, baseline_std=5, threshold_sigma=3) is False

# ─── CapacityForecaster tests ────────────────────────────────────────────

def test_linear_forecast_returns_periods():
    fc = CapacityForecaster()
    ts = [f"2026-03-{d:02d}T12:00:00" for d in range(1, 21)]
    vals = list(range(40, 60))
    result = fc.forecast(ts, vals, periods=10)
    assert len(result) == 10
    for item in result:
        assert "yhat" in item

def test_linear_forecast_insufficient_data():
    fc = CapacityForecaster()
    result = fc.forecast(["2026-01-01"], [50.0], periods=5)
    assert result == []

def test_saturation_detection():
    fc = CapacityForecaster()
    # Rising trend: 60, 65, 70 ... heading toward 90
    vals = list(np.linspace(60, 80, 30))
    eta = fc.estimate_saturation(vals, threshold=90.0)
    assert eta > 0, f"Expected positive ETA, got {eta}"

def test_saturation_flat_trend():
    fc = CapacityForecaster()
    vals = [50.0] * 30
    eta = fc.estimate_saturation(vals, threshold=90.0)
    assert eta == -1

# ─── MLPipeline integration tests ───────────────────────────────────────

@pytest.mark.asyncio
async def test_pipeline_anomaly_scan():
    pipeline = MLPipeline()
    history = list(np.random.normal(50, 3, 150))
    window  = [50.0, 51.0, 98.0, 50.5]  # index 2 is anomalous
    result  = await pipeline.run_anomaly_scan("srv-01", "cpu_pct", history, window)
    
    assert result["asset_id"] == "srv-01"
    assert "anomalies" in result
    # With 98.0 injected, at least one anomaly expected
    assert result["anomaly_count"] >= 1

@pytest.mark.asyncio
async def test_pipeline_capacity_forecast():
    pipeline = MLPipeline()
    ts   = [f"2026-03-{i+1:02d}T00:00:00" for i in range(20)]
    vals = list(np.linspace(60, 80, 20))
    result = await pipeline.run_capacity_forecast("srv-01", "disk_pct", ts, vals, threshold=90.0, periods=12)
    
    assert result["forecast_periods"] == 12
    assert isinstance(result["forecast"], list)
    assert result["eta_hours_to_saturation"] == -1 or result["eta_hours_to_saturation"] > 0
