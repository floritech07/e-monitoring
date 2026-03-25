from fastapi import APIRouter, Depends
from apps.api.auth.dependencies import require_role
from pydantic import BaseModel
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/integrations/legacy", tags=["legacy", "integrations"])

class LegacySyncRequest(BaseModel):
    system: str       # zabbix, nagios, prtg
    base_url: str
    credentials: Dict[str, Any]

@router.post("/sync")
async def trigger_legacy_sync(req: LegacySyncRequest, user=Depends(require_role("SITE_ADMIN"))):
    """Triggers a synchronisation pull from a legacy monitoring system."""
    
    if req.system == "zabbix":
        from packages.integrations.zabbix.client import ZabbixClient
        from packages.integrations.zabbix.connector import ZabbixConnector
        
        client = ZabbixClient(req.base_url, req.credentials["user"], req.credentials["password"])
        connector = ZabbixConnector(client)
        alerts = await connector.sync()
        return {"system": "zabbix", "alerts_synced": len(alerts)}

    elif req.system == "nagios":
        from packages.integrations.nagios.connector import NagiosConnector
        connector = NagiosConnector(req.base_url, req.credentials["user"], req.credentials["password"])
        problems = await connector.get_problem_hosts()
        return {"system": "nagios", "problem_hosts": len(problems)}

    elif req.system == "prtg":
        from packages.integrations.prtg.client import PrtgClient
        client = PrtgClient(req.base_url, req.credentials["username"], req.credentials["passhash"])
        alerts = await client.get_alerts()
        return {"system": "prtg", "alerts": len(alerts)}

    return {"system": req.system, "status": "unsupported"}

@router.get("/systems")
async def list_legacy_systems(user=Depends(require_role("VIEWER"))):
    return {"systems": ["zabbix", "nagios", "prtg", "solarwinds", "icinga"]}
