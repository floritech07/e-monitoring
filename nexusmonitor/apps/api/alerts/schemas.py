from pydantic import BaseModel, ConfigDict
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

class AlertStateEnum(str, Enum):
    PENDING = "PENDING"
    FIRING = "FIRING"
    RESOLVED = "RESOLVED"
    SILENCED = "SILENCED"

class SeverityEnum(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    WARNING = "WARNING"
    INFO = "INFO"

class AlertRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    metric_expression: str
    condition: str
    threshold: str
    duration_seconds: int = 300
    severity: SeverityEnum
    asset_scope_tags: Optional[Dict[str, str]] = None

class AlertRuleResponse(AlertRuleCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    organization_id: UUID

class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    message: str
    severity: SeverityEnum
    state: AlertStateEnum
    fired_at: Optional[datetime]
    resolved_at: Optional[datetime]
    acknowledged_at: Optional[datetime]
    value_at_trigger: Optional[str]
    rule_id: Optional[UUID]
    asset_id: UUID

class SilenceCreate(BaseModel):
    asset_id: UUID
    rule_id: Optional[UUID] = None
    duration_minutes: int
    comment: Optional[str] = None
