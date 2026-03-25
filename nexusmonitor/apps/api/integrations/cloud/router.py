from fastapi import APIRouter, Depends
from apps.api.auth.dependencies import require_role
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/integrations/cloud", tags=["cloud", "integrations"])

class CloudSyncRequest(BaseModel):
    provider: str  # aws, azure, gcp
    config: Dict[str, Any]

@router.post("/discover")
async def trigger_cloud_discovery(req: CloudSyncRequest, user=Depends(require_role("SITE_ADMIN"))):
    """Triggers asset discovery for a cloud provider (AWS EC2, Azure VMs, GCP GCE)."""
    logger.info(f"Cloud discovery triggered for provider={req.provider}")
    
    if req.provider == "aws":
        from packages.integrations.aws.connector import AWSConnector
        connector = AWSConnector(
            region=req.config.get("region", "eu-west-1"),
            access_key=req.config.get("access_key"),
            secret_key=req.config.get("secret_key")
        )
        assets = connector.discover_instances()
        return {"provider": "aws", "assets_discovered": len(assets), "assets": assets}

    elif req.provider == "azure":
        from packages.integrations.azure.connector import AzureMonitorConnector
        connector = AzureMonitorConnector(
            tenant_id=req.config["tenant_id"],
            client_id=req.config["client_id"],
            client_secret=req.config["client_secret"],
            subscription_id=req.config["subscription_id"]
        )
        vms = await connector.list_vms()
        return {"provider": "azure", "assets_discovered": len(vms), "assets": vms}

    return {"provider": req.provider, "status": "not_implemented"}

@router.get("/providers")
async def list_cloud_providers(user=Depends(require_role("VIEWER"))):
    return {"providers": ["aws", "azure", "gcp"], "feature_flags": {"aws": True, "azure": True, "gcp": True}}
