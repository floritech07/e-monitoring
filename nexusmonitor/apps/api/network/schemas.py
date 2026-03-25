from pydantic import BaseModel, Field
from typing import Optional

class TopologyNode(BaseModel):
    id: str = Field(..., description="Unique asset or node identifier")
    label: str = Field(..., description="Display string")
    type: str = Field(..., description="router, switch, server, firewall")
    status: str = Field(..., description="healthy, warning, critical, unknown")

class TopologyEdge(BaseModel):
    source: str = Field(..., description="Source Node ID")
    target: str = Field(..., description="Target Node ID")
    protocol: Optional[str] = Field(None, description="e.g. LLDP, CDP, OSPF, BGP")
    bandwidth_gbps: Optional[float] = None
