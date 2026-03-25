from sqlalchemy import Column, String, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from packages.db.models.base import Base

class Dashboard(Base):
    __tablename__ = "dashboards"

    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    is_public = Column(Boolean, default=False)
    layout = Column(JSON, nullable=False, default=[]) # react-grid-layout config
    
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)

    widgets = relationship("Widget", back_populates="dashboard", cascade="all, delete-orphan")


class Widget(Base):
    __tablename__ = "widgets"

    name = Column(String(255), nullable=True)
    type = Column(String(50), nullable=False)  # StatCard, LineChart, Gauge, etc.
    config = Column(JSON, nullable=False, default={}) # Chart config, metrics selected, time range
    
    dashboard_id = Column(UUID(as_uuid=True), ForeignKey("dashboards.id", ondelete="CASCADE"), nullable=False)
    
    dashboard = relationship("Dashboard", back_populates="widgets")
