import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, declared_attr

def generate_uuid():
    return uuid.uuid4()

def utc_now():
    return datetime.now(timezone.utc)

class Base(DeclarativeBase):
    """Base class for all SQLAlchemy declarative models."""

    @declared_attr.directive
    def __tablename__(cls) -> str:
        # Converts CamelCase to snake_case if desired, or simple lower
        name = cls.__name__
        return ''.join(['_' + c.lower() if c.isupper() else c for c in name]).lstrip('_')
        
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        """Converts model instance to dict."""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    def __repr__(self) -> str:
        attrs = ", ".join([f"{k}={v}" for k, v in self.to_dict().items() if k in ["id", "name", "status"]])
        return f"<{self.__class__.__name__}({attrs})>"
