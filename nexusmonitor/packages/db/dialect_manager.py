import logging
import os
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

logger = logging.getLogger(__name__)

class DialectManager:
    """Provides abstract multi-SGBD support via SQLAlchemy dialects."""
    
    SUPPORTED_ENGINES = ["postgresql", "oracle", "mssql", "mysql", "mariadb"]

    @staticmethod
    def get_engine(database_url: str, pool_size: int = 20, max_overflow: int = 10, pool_pre_ping: bool = True) -> AsyncEngine:
        """Returns the appropriate AsyncEngine based on the URL and DB_ENGINE."""
        db_engine_env = os.getenv("DB_ENGINE", "postgresql").lower()
        
        if db_engine_env not in DialectManager.SUPPORTED_ENGINES:
            logger.warning(f"Unsupported DB_ENGINE {db_engine_env}, falling back to postgresql.")
            db_engine_env = "postgresql"

        # Transform generic postgresql:// to postgresql+asyncpg:// if needed
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif database_url.startswith("mysql://") or database_url.startswith("mariadb://"):
            database_url = database_url.replace("mysql://", "mysql+aiomysql://", 1).replace("mariadb://", "mariadb+aiomysql://", 1)
            
        logger.info(f"Initialising database engine using dialect: {db_engine_env}")
        
        return create_async_engine(
            database_url,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_pre_ping=pool_pre_ping,
            echo=os.getenv("SQL_ECHO", "false").lower() == "true",
        )
