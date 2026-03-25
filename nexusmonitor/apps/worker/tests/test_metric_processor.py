import pytest
import json
from apps.worker.tasks.metric_processor import _async_process_batch
from packages.db.models.organization import Organization
from packages.db.models.asset import Asset, AssetType
from packages.db.models.metric import MetricSeries, MetricPoint
from sqlalchemy.future import select

@pytest.mark.asyncio
async def test_process_batch_creates_points_and_series(db_session, monkeypatch):
    # Mock db.get_session in the task module
    class MockDBManager:
        from contextlib import asynccontextmanager
        @asynccontextmanager
        async def get_session(self):
            yield db_session
            
    import apps.worker.tasks.metric_processor as mp
    monkeypatch.setattr(mp, "db", MockDBManager())
    
    # Needs valid asset
    org = Organization(name="WorkerOrg")
    asset = Asset(name="test-worker-host", type=AssetType.PHYSICAL_HOST, organization=org)
    db_session.add_all([org, asset])
    await db_session.commit()
    
    points = [
        {"asset_id": str(asset.id), "metric_name": "net.bytes", "value": 1024.0, "timestamp": 1690000000, "labels": {"iface": "eth0"}}
    ]
    
    await _async_process_batch(points)
    
    # Verify series auto-creation
    stmt = select(MetricSeries).where(MetricSeries.asset_id == asset.id, MetricSeries.name == "net.bytes")
    series_obj = (await db_session.execute(stmt)).scalars().first()
    assert series_obj is not None
    
    # Verify point creation
    stmt = select(MetricPoint).where(MetricPoint.series_id == series_obj.id)
    pts = (await db_session.execute(stmt)).scalars().all()
    assert len(pts) == 1
    assert pts[0].value == 1024.0
