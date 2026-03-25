import logging
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    logger.warning("Prophet not installed. Falling back to linear trend extrapolation.")


class CapacityForecaster:
    """
    Multi-horizon time-series forecaster for capacity planning.
    Uses Facebook Prophet when available; falls back to linear regression.
    """

    def __init__(self, seasonality: bool = True, changepoint_prior_scale: float = 0.05):
        self.seasonality = seasonality
        self.changepoint_prior_scale = changepoint_prior_scale

    def forecast(self, timestamps: List[str], values: List[float], periods: int = 30) -> List[Dict[str, Any]]:
        """
        Given a historical series, forecast `periods` future data points.
        Returns list of {ds, yhat, yhat_lower, yhat_upper} dicts.
        """
        if len(timestamps) < 10:
            logger.warning("Insufficient data for forecasting (<10 points)")
            return []

        df = pd.DataFrame({"ds": pd.to_datetime(timestamps), "y": values})

        if PROPHET_AVAILABLE:
            return self._forecast_prophet(df, periods)
        else:
            return self._forecast_linear(df, periods)

    def _forecast_prophet(self, df: pd.DataFrame, periods: int) -> List[Dict[str, Any]]:
        model = Prophet(
            daily_seasonality=self.seasonality,
            yearly_seasonality=False,
            changepoint_prior_scale=self.changepoint_prior_scale
        )
        model.fit(df)
        future = model.make_future_dataframe(periods=periods, freq="H")
        forecast = model.predict(future).tail(periods)

        return [
            {
                "ds": str(row.ds),
                "yhat": round(row.yhat, 4),
                "yhat_lower": round(row.yhat_lower, 4),
                "yhat_upper": round(row.yhat_upper, 4),
            }
            for _, row in forecast.iterrows()
        ]

    def _forecast_linear(self, df: pd.DataFrame, periods: int) -> List[Dict[str, Any]]:
        """Least-squares linear regression fallback when Prophet is unavailable."""
        import numpy as np
        y = df["y"].values
        x = np.arange(len(y))
        coeffs = np.polyfit(x, y, 1)  # slope, intercept

        results = []
        for i in range(periods):
            future_x = len(y) + i
            yhat = coeffs[0] * future_x + coeffs[1]
            results.append({"ds": f"future+{i}h", "yhat": round(yhat, 4), "yhat_lower": round(yhat * 0.9, 4), "yhat_upper": round(yhat * 1.1, 4)})
        return results

    def estimate_saturation(self, values: List[float], threshold: float) -> int:
        """
        Estimates how many time units until `values` trend exceeds `threshold`.
        Returns -1 if no saturation projected within 2× the current data length.
        """
        import numpy as np
        y = np.array(values)
        x = np.arange(len(y))
        if len(y) < 3:
            return -1
        coeffs = np.polyfit(x, y, 1)
        if coeffs[0] <= 0:
            return -1  # Decreasing trend; no saturation
        # n such that coeffs[0]*n + coeffs[1] >= threshold
        n_sat = (threshold - coeffs[1]) / coeffs[0]
        remaining = int(n_sat - len(y))
        return max(-1, remaining)
