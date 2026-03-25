from sqlalchemy import Column, String, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from packages.db.models.base import Base

class AssetType(str, enum.Enum):
    VIRTUAL_MACHINE = "VIRTUAL_MACHINE"
    PHYSICAL_HOST = "PHYSICAL_HOST"
    NETWORK_SWITCH = "NETWORK_SWITCH"
    NETWORK_ROUTER = "NETWORK_ROUTER"
    FIREWALL = "FIREWALL"
    STORAGE_ARRAY = "STORAGE_ARRAY"
    DATABASE = "DATABASE"
    BACKUP_REPOSITORY = "BACKUP_REPOSITORY"
    CLOUD_INSTANCE = "CLOUD_INSTANCE"
    OTHER = "OTHER"

class Asset(Base):
    __tablename__ = "assets"

    name = Column(String(255), nullable=False, index=True)
    type = Column(SQLEnum(AssetType), nullable=False)
    ip_address = Column(String(45), nullable=True) # IPv4 or IPv6
    mac_address = Column(String(17), nullable=True)
    status = Column(String(50), nullable=False, default="UNKNOWN", index=True) # ONLINE, OFFLINE, MAINTENANCE, DEGRADED
    metadata_json = Column(JSON, default={}) # OS version, CPU cores, RAM bytes, tags

    # Hierarchy and scoping
    parent_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="SET NULL"), nullable=True)
    integration_id = Column(UUID(as_uuid=True), ForeignKey("integrations.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    parent = relationship("Asset", remote_side="Asset.id", backref="children")
    organization = relationship("Organization", back_populates="assets")
    site = relationship("Site", back_populates="assets")
    integration = relationship("Integration", back_populates="assets")
    
    metric_series = relationship("MetricSeries", back_populates="asset", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="asset", cascade="all, delete-orphan")
