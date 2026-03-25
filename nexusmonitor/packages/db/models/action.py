from sqlalchemy import Column, String, ForeignKey, JSON, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from packages.db.models.base import Base

class ActionLog(Base):
    __tablename__ = "action_logs"

    action_type = Column(String(100), nullable=False) # IPMI, SSH, VSPHERE
    target_asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True)
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # User or System
    
    parameters = Column(JSON, default={}) # Sanitized payload
    
    result = Column(String(50), nullable=False) # SUCCESS, FAILURE, TIMEOUT
    exit_code = Column(Integer, nullable=True)
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)


class MaintenanceWindow(Base):
    __tablename__ = "maintenance_windows"

    name = Column(String(255), nullable=False)
    reason = Column(String(500), nullable=True)
    cron_schedule = Column(String(100), nullable=True) # If recurring
    
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)

class Runbook(Base):
    __tablename__ = "runbooks"
    
    name = Column(String(255), nullable=False)
    dag_json = Column(JSON, nullable=False, default=[]) # Graph of steps
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
