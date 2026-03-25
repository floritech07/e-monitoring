from sqlalchemy import Column, String, Integer, ForeignKey, JSON, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from packages.db.models.base import Base

class AlertState(Base):
    __tablename__ = "alert_states"
    # Mapping table for normalization later, or simply use Enum inside Alert

class AlertRule(Base):
    __tablename__ = "alert_rules"

    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    metric_expression = Column(String(1000), nullable=False) # e.g. cpu.usage > 85
    condition = Column(String(255), nullable=False)    # e.g. '>'
    threshold = Column(String(255), nullable=False)    # e.g. '85'
    duration_seconds = Column(Integer, nullable=False, default=300) # Required duration before firing
    severity = Column(String(50), nullable=False) # CRITICAL, HIGH, WARNING, INFO
    
    asset_scope_tags = Column(JSON, nullable=True) # Which assets this rule applies to
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)

class Alert(Base):
    __tablename__ = "alerts"

    message = Column(String(1000), nullable=False)
    severity = Column(String(50), nullable=False, index=True)
    state = Column(String(50), nullable=False, default="PENDING", index=True) # PENDING, FIRING, RESOLVED, SILENCED
    
    fired_at = Column(DateTime(timezone=True), nullable=True, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    value_at_trigger = Column(String(255), nullable=True)
    
    rule_id = Column(UUID(as_uuid=True), ForeignKey("alert_rules.id", ondelete="SET NULL"), nullable=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)

    asset = relationship("Asset", back_populates="alerts")
    # rule = relationship("AlertRule") 
    
    __table_args__ = (
        Index('idx_alerts_state_severity', 'state', 'severity'),
    )
