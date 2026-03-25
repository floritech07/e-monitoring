import numpy as np
import logging
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class AnomalyDetector:
    """
    Isolation Forest–based anomaly detection engine for time-series metric streams.
    Trained per-asset on historical data; inference happens on incoming windows.
    """

    def __init__(self, contamination: float = 0.05, n_estimators: int = 100):
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.model: IsolationForest | None = None
        self.scaler = StandardScaler()
        self.trained = False

    def train(self, data: List[float]) -> None:
        """
        Fit model on a 1-D array of historical metric values.
        Automatically scales features for stable convergence.
        """
        if len(data) < 20:
            logger.warning("Training set too small (< 20 samples). Skipping IsolationForest fit.")
            return

        X = np.array(data).reshape(-1, 1)
        X_scaled = self.scaler.fit_transform(X)

        self.model = IsolationForest(
            n_estimators=self.n_estimators,
            contamination=self.contamination,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_scaled)
        self.trained = True
        logger.info(f"AnomalyDetector trained on {len(data)} samples | contamination={self.contamination}")

    def predict(self, values: List[float]) -> List[Dict[str, Any]]:
        """
        Returns per-value anomaly assessment.
        -1 = anomaly, 1 = normal (IsolationForest convention).
        Score is normalized Anomaly Severity [0–1].
        """
        if not self.trained or self.model is None:
            return [{"value": v, "is_anomaly": False, "score": 0.0} for v in values]

        X = np.array(values).reshape(-1, 1)
        X_scaled = self.scaler.transform(X)

        preds   = self.model.predict(X_scaled)        # -1 / +1
        scores  = self.model.score_samples(X_scaled)  # negative log-likelihood
        # Normalize score to [0, 1]: smaller score_sample = more anomalous
        s_min, s_max = scores.min(), scores.max()
        norm_scores = (scores - s_min) / (s_max - s_min + 1e-9)

        results = []
        for v, pred, ns in zip(values, preds, norm_scores):
            results.append({
                "value": float(v),
                "is_anomaly": int(pred) == -1,
                "score": round(1.0 - float(ns), 4)  # invert: high=more anomalous
            })
        return results

    def detect_deviation(self, current: float, baseline_mean: float, baseline_std: float, threshold_sigma: float = 3.0) -> bool:
        """Statistical Z-score deviation check against known baseline."""
        if baseline_std == 0:
            return False
        z = abs(current - baseline_mean) / baseline_std
        return z >= threshold_sigma
