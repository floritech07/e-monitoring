import logging
import httpx
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

class AzureMonitorConnector:
    """
    Azure Monitor REST API connector using service principal authentication.
    Retrieves VM metrics via the Azure Resource REST API.
    """

    def __init__(self, tenant_id: str, client_id: str, client_secret: str, subscription_id: str):
        self.tenant_id = tenant_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.subscription_id = subscription_id
        self._token: str | None = None

    async def _get_token(self) -> str:
        url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": "https://management.azure.com/.default"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, data=data)
            resp.raise_for_status()
            self._token = resp.json()["access_token"]
        return self._token

    async def _auth_headers(self) -> dict:
        token = self._token or await self._get_token()
        return {"Authorization": f"Bearer {token}"}

    async def list_vms(self) -> List[Dict[str, Any]]:
        """Lists all VMs in the subscription."""
        headers = await self._auth_headers()
        url = f"https://management.azure.com/subscriptions/{self.subscription_id}/providers/Microsoft.Compute/virtualMachines?api-version=2023-03-01"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            vms = resp.json().get("value", [])

        results = []
        for vm in vms:
            results.append({
                "source": "azure",
                "external_id": vm["id"],
                "name": vm["name"],
                "region": vm.get("location", ""),
                "type": vm.get("properties", {}).get("hardwareProfile", {}).get("vmSize", "")
            })
        logger.info(f"Azure: {len(results)} VMs discovered")
        return results
