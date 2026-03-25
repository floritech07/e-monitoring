from pydantic import BaseModel
from typing import Optional

class CorrelationEventIn(BaseModel):
    asset_id: str
    title: str
    category: str
    severity: str
    state: Optional[str] = "FIRING"
    site_id: Optional[str] = None
    timestamp: Optional[str] = None

class CorrelationResult(BaseModel):
    action: str
    group_key: str
    group_size: Optional[int] = None
    priority_score: Optional[float] = None
