from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from packages.db.models.base import Base

class Organization(Base):
    __tablename__ = "organizations"

    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)

    # Relationships
    sites = relationship("Site", back_populates="organization", cascade="all, delete-orphan")
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="organization", cascade="all, delete-orphan")
