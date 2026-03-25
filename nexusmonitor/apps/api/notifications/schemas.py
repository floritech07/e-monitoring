from pydantic import BaseModel
from typing import List, Dict, Any

class NotificationChannel(BaseModel):
    type: str
    config: Dict[str, Any]

class NotificationTestRequest(BaseModel):
    channels: List[NotificationChannel]

class NotificationTestResponse(BaseModel):
    results: Dict[str, bool]
