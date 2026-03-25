from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from packages.db.models.base import Base

class Integration(Base):
    __tablename__ = "integrations"

    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False) # veeam, vcenter, zabbix, snmp, etc.
    config = Column(JSON, nullable=False, default={}) # Credentials go to encrypted secrets manager ideally, or EncryptedType
    status = Column(String(50), nullable=False, default="DISCONNECTED")

    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    assets = relationship("Asset", back_populates="integration")
