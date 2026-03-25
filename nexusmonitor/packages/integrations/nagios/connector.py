import logging
import httpx
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class NagiosConnector:
    """Pulls host/service check results from Nagios/Naemon via status.dat or REST API."""

    def __init__(self, base_url: str, user: str, password: str):
        self.base_url = base_url.rstrip('/')
        self.user = user
        self.password = password

    async def get_host_status(self) -> List[Dict[str, Any]]:
        """Fetches host status from the legacy Nagios CGI JSON endpoint."""
        url = f"{self.base_url}/cgi-bin/statusjson.cgi?query=hostlist&details=true"
        async with httpx.AsyncClient(auth=(self.user, self.password), timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        hosts = []
        for name, info in data.get("data", {}).get("hostlist", {}).items():
            hosts.append({
                "source": "nagios",
                "name": name,
                "status": info.get("status", "UNKNOWN"),
                "plugin_output": info.get("plugin_output", ""),
                "acknowledged": info.get("problem_has_been_acknowledged", False),
            })
        logger.info(f"Nagios sync: {len(hosts)} hosts retrieved")
        return hosts

    async def get_problem_hosts(self) -> List[Dict[str, Any]]:
        """Returns only DOWN/UNREACHABLE hosts."""
        all_hosts = await self.get_host_status()
        return [h for h in all_hosts if h["status"] not in ("UP", "OK")]
