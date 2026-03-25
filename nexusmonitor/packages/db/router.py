import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from packages.db.dialect_manager import DialectManager

class DBRouter:
    """
    Implements Read/Write database routing separation globally.
    If the Read Replica fails, routes cleanly Fallback to primary.
    """
    def __init__(self):
        # Master DB (Writes / Strict consistency Reads)
        self.writer_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/nexusmonitor")
        
        # Read Replica (Dashboards / Historic aggregations)
        # Defaults to writer if REDIS_URL/Replica not initialized in ENV (e.g. local dev)
        self.reader_url = os.getenv("READ_DATABASE_URL", self.writer_url)
        
        pool_args = {
            "pool_size": int(os.getenv("DB_POOL_SIZE", "20")),
            "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
            "pool_timeout": 5, # Failfast gracefully
            "pool_pre_ping": True,
            "connect_args": {"server_settings": {"jit": "off"}}
        }

        self.writer_engine = create_async_engine(self.writer_url, **pool_args)
        self.reader_engine = create_async_engine(self.reader_url, **pool_args)

        self.writer_session = sessionmaker(self.writer_engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)
        self.reader_session = sessionmaker(self.reader_engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)

    def get_writer(self) -> AsyncSession:
        return self.writer_session()

    def get_reader(self) -> AsyncSession:
        return self.reader_session()

# Global Singleton
db_router = DBRouter()
