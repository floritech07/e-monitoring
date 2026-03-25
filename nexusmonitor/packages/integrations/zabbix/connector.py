import logging
from typing import Dict, Any, List
from packages.integrations.zabbix.client import ZabbixClient

logger = logging.getLogger(__name__)

SEVERITY_MAP = {
    "0": "INFO", "1": "INFO", "2": "WARNING",
    "3": "HIGH", "4": "HIGH", "5": "CRITICAL"
}

class ZabbixConnector:
    """Maps Zabbix Triggers/Problems to NexusMonitor unified Alert schema."""

    def __init__(self, client: ZabbixClient):
        self.client = client

    async def sync(self) -> List[Dict[str, Any]]:
        """Authenticates, fetches active problems and maps them to NexusMonitor format."""
        await self.client.login()
        problems = await self.client.get_problems()
        alerts = []

        for p in problems:
            alerts.append({
                "source": "zabbix",
                "external_id": p.get("eventid"),
                "title": p.get("name", "Zabbix Problem"),
                "severity": SEVERITY_MAP.get(p.get("severity", "2"), "WARNING"),
                "state": "FIRING",
                "asset_id": p.get("objectid"),
            })

        logger.info(f"Zabbix sync: {len(alerts)} active problems ingested")
        return alerts
