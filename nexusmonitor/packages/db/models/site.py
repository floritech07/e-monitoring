from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from packages.db.models.base import Base

class Site(Base):
    __tablename__ = "sites"

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="sites")
    assets = relationship("Asset", back_populates="site", cascade="all, delete-orphan")
