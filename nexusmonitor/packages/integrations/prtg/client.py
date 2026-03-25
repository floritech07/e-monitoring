import logging
import httpx
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class PrtgClient:
    """Async PRTG Network Monitor REST API client."""

    def __init__(self, host: str, username: str, passhash: str, use_ssl: bool = True):
        scheme = "https" if use_ssl else "http"
        self.base_url = f"{scheme}://{host}"
        self.auth = {"username": username, "passhash": passhash}

    async def _get(self, endpoint: str, extra_params: dict = None) -> dict:
        params = {**self.auth, "output": "json", **(extra_params or {})}
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.get(f"{self.base_url}/api/{endpoint}", params=params)
            resp.raise_for_status()
            return resp.json()

    async def get_sensors(self, columns: str = "objid,name,status,message,lastvalue") -> List[Dict]:
        data = await self._get("table.json", {"content": "sensors", "columns": columns})
        return data.get("sensors", [])

    async def get_alerts(self) -> List[Dict[str, Any]]:
        """Returns sensors in non-OK state as normalized alert dicts."""
        sensors = await self.get_sensors()
        alerts = []
        for s in sensors:
            status = s.get("status_raw", 0)
            if status not in (3, 5):  # 3=Up, 5=Unknown; flag everything else
                alerts.append({
                    "source": "prtg",
                    "external_id": str(s.get("objid")),
                    "title": s.get("name"),
                    "severity": "HIGH" if status == 4 else "WARNING",  # 4=Down
                    "state": "FIRING",
                    "message": s.get("message", ""),
                })
        logger.info(f"PRTG: {len(alerts)} non-OK sensors mapped")
        return alerts
