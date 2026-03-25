from sqlalchemy import Column, String, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from packages.db.models.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    # Immutable structure append-only tracking all changes
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    
    ip_address = Column(String(45), nullable=True)
    http_method = Column(String(10), nullable=False)
    resource_type = Column(String(100), nullable=False) # e.g. "Asset", "User"
    resource_id = Column(String(255), nullable=False)
    
    action = Column(String(50), nullable=False) # CREATE, UPDATE, DELETE
    changes = Column(JSON, default={}) # Diff json

    # Note: RLS should be enabled on database side to prevent app_user from deleting this table's rows
