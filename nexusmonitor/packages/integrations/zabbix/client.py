import logging
import httpx
from typing import Any, Dict, List
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

class ZabbixClient:
    """Async JSON-RPC 2.0 client for Zabbix API v6+."""

    def __init__(self, url: str, user: str, password: str):
        self.url = url.rstrip('/') + '/api_jsonrpc.php'
        self.user = user
        self.password = password
        self._auth_token: str | None = None

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def _rpc(self, method: str, params: Any) -> Any:
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": 1,
            "auth": self._auth_token
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(self.url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            if "error" in data:
                raise RuntimeError(f"Zabbix API error: {data['error']}")
            return data.get("result")

    async def login(self) -> None:
        token = await self._rpc("user.login", {"user": self.user, "password": self.password})
        self._auth_token = token
        logger.info("Authenticated to Zabbix API")

    async def get_hosts(self) -> List[Dict]:
        return await self._rpc("host.get", {
            "output": ["hostid", "host", "name", "status"],
            "selectInterfaces": ["ip"],
        })

    async def get_problems(self) -> List[Dict]:
        return await self._rpc("problem.get", {
            "output": "extend",
            "recent": True,
            "sortfield": ["eventid"],
            "sortorder": "DESC",
            "limit": 100,
        })

    async def get_triggers(self, host_ids: List[str]) -> List[Dict]:
        return await self._rpc("trigger.get", {
            "hostids": host_ids,
            "output": ["triggerid", "description", "priority", "value"],
            "filter": {"value": 1},  # Only firing triggers
        })
