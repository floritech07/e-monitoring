import logging
import boto3
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

class AWSConnector:
    """AWS CloudWatch and EC2 resource connector using boto3."""

    def __init__(self, region: str, access_key: str = None, secret_key: str = None):
        session_kwargs: dict = {"region_name": region}
        if access_key and secret_key:
            session_kwargs["aws_access_key_id"] = access_key
            session_kwargs["aws_secret_access_key"] = secret_key
        self.session = boto3.Session(**session_kwargs)
        self.ec2 = self.session.client("ec2")
        self.cw  = self.session.client("cloudwatch")

    def discover_instances(self) -> List[Dict[str, Any]]:
        """Returns all running EC2 instances as NexusMonitor asset stubs."""
        resp = self.ec2.describe_instances(Filters=[{"Name": "instance-state-name", "Values": ["running"]}])
        assets = []
        for reservation in resp.get("Reservations", []):
            for inst in reservation.get("Instances", []):
                name = next((t["Value"] for t in inst.get("Tags", []) if t["Key"] == "Name"), inst["InstanceId"])
                assets.append({
                    "source": "aws",
                    "external_id": inst["InstanceId"],
                    "name": name,
                    "ip_address": inst.get("PrivateIpAddress", ""),
                    "type": inst.get("InstanceType", ""),
                    "region": inst.get("Placement", {}).get("AvailabilityZone", ""),
                })
        logger.info(f"AWS EC2 discovery: {len(assets)} running instances")
        return assets

    def get_cpu_metric(self, instance_id: str, period_minutes: int = 5) -> float:
        """Fetches the latest average CPUUtilization from CloudWatch."""
        end = datetime.now(tz=timezone.utc)
        start = end - timedelta(minutes=period_minutes)
        resp = self.cw.get_metric_statistics(
            Namespace="AWS/EC2",
            MetricName="CPUUtilization",
            Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
            StartTime=start,
            EndTime=end,
            Period=period_minutes * 60,
            Statistics=["Average"]
        )
        points = resp.get("Datapoints", [])
        if not points:
            return -1.0
        return round(max(p["Average"] for p in points), 2)
