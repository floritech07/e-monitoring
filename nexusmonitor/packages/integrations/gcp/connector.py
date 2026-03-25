import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

try:
    from google.cloud import monitoring_v3
    from google.cloud.monitoring_v3 import query
    GCP_AVAILABLE = True
except ImportError:
    GCP_AVAILABLE = False
    logger.warning("google-cloud-monitoring not installed. GCP connector in stub mode.")

class GCPMonitoringConnector:
    """
    Google Cloud Monitoring connector using the official monitoring_v3 client library.
    Fetches Compute Engine instance metrics via Metrics Query API.
    """

    def __init__(self, project_id: str):
        self.project_id = project_id

    def get_cpu_utilization(self, instance_id: str, minutes: int = 5) -> float:
        """Returns average CPU utilization for a GCE instance from Stackdriver."""
        if not GCP_AVAILABLE:
            logger.warning("GCP client stub: returning mock 0.0")
            return 0.0

        client = monitoring_v3.MetricServiceClient()
        project_name = f"projects/{self.project_id}"
        
        from google.protobuf.timestamp_pb2 import Timestamp
        import time
        now = time.time()
        interval = monitoring_v3.TimeInterval(
            end_time=Timestamp(seconds=int(now)),
            start_time=Timestamp(seconds=int(now - minutes * 60))
        )
        
        results = client.list_time_series(
            name=project_name,
            filter=f'metric.type="compute.googleapis.com/instance/cpu/utilization" AND metric.labels.instance_id="{instance_id}"',
            interval=interval,
            view=monitoring_v3.ListTimeSeriesRequest.TimeSeriesView.FULL
        )
        
        values = [p.value.double_value for ts in results for p in ts.points]
        if not values:
            return -1.0
        return round(sum(values) / len(values) * 100, 2)
