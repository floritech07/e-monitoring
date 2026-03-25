from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from packages.db.engine import db_manager

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI endpoints."""
    async with db_manager.get_session() as session:
        yield session
