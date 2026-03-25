import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID

from packages.db.models.base import Base

class APIKey(Base):
    __tablename__ = "api_keys"

    key_hash = Column(String(255), nullable=False, unique=True, index=True)
    prefix = Column(String(10), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    scopes = Column(JSON, default=["read"])
    expires_at = Column(DateTime(timezone=True), nullable=True)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)


def generate_api_key() -> tuple[str, str, str]:
    """Generates an API key. Returns (raw_key, prefix, hash)"""
    import hashlib
    
    raw_secret = secrets.token_urlsafe(32)
    api_key = f"nm_live_{raw_secret}"
    
    # Store prefix to allow UI scanning ('nm_live_abcd****')
    prefix = api_key[:12]
    
    # Simple hash for storage
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    return api_key, prefix, key_hash
