from pydantic import BaseModel
from typing import Optional, Dict, Any

class WSEvent(BaseModel):
    type: str # metric.update, alert.fired, asset.status_changed
    org_id: str
    payload: Dict[str, Any]

def create_redis_channel(org_id: str, event_type: str) -> str:
    return f"nm:{org_id}:{event_type}"
