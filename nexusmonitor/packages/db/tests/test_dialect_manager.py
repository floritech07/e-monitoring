import os
import pytest
from packages.db.dialect_manager import DialectManager

def test_dialect_selection(monkeypatch):
    url = "postgresql://user:pass@localhost:5432/db"
    
    # Test PG translation
    engine = DialectManager.get_engine(url)
    assert engine.url.drivername == "postgresql+asyncpg"

    # Test unknown engine fallback
    monkeypatch.setenv("DB_ENGINE", "unknown_db")
    engine2 = DialectManager.get_engine(url)
    assert engine2.url.drivername == "postgresql+asyncpg"

def test_mysql_dialect(monkeypatch):
    monkeypatch.setenv("DB_ENGINE", "mysql")
    url = "mysql://user:pass@localhost:3306/db"
    
    engine = DialectManager.get_engine(url)
    assert engine.url.drivername == "mysql+aiomysql"
