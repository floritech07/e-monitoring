from fastapi import APIRouter, Depends, HTTPException
from typing import List
from apps.api.network.schemas import TopologyEdge, TopologyNode
from apps.api.auth.dependencies import require_role
from uuid import UUID

import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/network", tags=["network", "topology"])

@router.get("/topology", response_model=dict)
async def get_full_topology(user=Depends(require_role("VIEWER"))):
    """
    Returns the network graph containing Node vertices and LLDP formulated Edges.
    Output is modeled for direct ingestion by D3.js or PixiJS frontend canvases.
    """
    # Sample representation mapping DB assets
    nodes = [
        TopologyNode(id="fw-01", label="Core Firewall", type="firewall", status="healthy"),
        TopologyNode(id="sw-01", label="Dist Switch A", type="switch", status="warning"),
        TopologyNode(id="esx-01", label="ESXi Host 1", type="server", status="healthy")
    ]
    edges = [
        TopologyEdge(source="fw-01", target="sw-01", protocol="L3", bandwidth_gbps=10.0),
        TopologyEdge(source="sw-01", target="esx-01", protocol="L2", bandwidth_gbps=25.0),
    ]
    
    return {
        "nodes": [n.dict() for n in nodes],
        "edges": [e.dict() for e in edges]
    }
    
@router.post("/discovery/trigger")
async def trigger_lldp_walk(asset_id: UUID, user=Depends(require_role("OPERATOR"))):
    """Manually invoke the TopologyDiscovery polling task for an Asset."""
    # Would push task to Celery
    return {"message": "LLDP discovery queued", "asset_id": str(asset_id)}
