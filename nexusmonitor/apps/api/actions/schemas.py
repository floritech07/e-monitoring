from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class ActionRequest(BaseModel):
    action_type: str = Field(..., description="ssh, wmi, vsphere, ipmi, veeam")
    params: Dict[str, Any] = Field(..., description="Action-specific parameters like IP, Username, VM ID")

class ActionResponse(BaseModel):
    action_type: str
    success: bool
    output: str
    error: Optional[str] = None
    execution_time_ms: float
