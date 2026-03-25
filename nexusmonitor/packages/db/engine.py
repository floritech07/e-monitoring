import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from packages.db.dialect_manager import DialectManager

class DatabaseManager:
    """Manages the database connection pool and sessions."""

    def __init__(self, database_url: str | None = None):
        self._url = database_url or os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/nexusmonitor")
        
        # FIX-002: Strict pooling settings ready for PgBouncer / high concurrency
        self._engine = create_async_engine(
            self._url,
            pool_size=int(os.getenv("DB_POOL_SIZE", "20")),
            max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
            pool_timeout=int(os.getenv("DB_POOL_TIMEOUT", "30")),
            pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "1800")),
            pool_pre_ping=True,
            # PgBouncer compatibility for Transaction pooling:
            connect_args={"server_settings": {"jit": "off"}}
        )

        self._session_factory = sessionmaker(
            self._engine, 
            class_=AsyncSession, 
            expire_on_commit=False,
            autoflush=False
        )

    @property
    def engine(self) -> AsyncEngine:
        return self._engine

    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Provide a transactional scope around a series of operations."""
        session = self._session_factory()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
            
    async def health_check(self) -> bool:
        """Check if database is responsive."""
        try:
            async with self._engine.connect() as conn:
                await conn.execute("SELECT 1")
            return True
        except Exception:
            return False

# Global instance initialized upon import if possible, or later by the app
db_manager = DatabaseManager()
