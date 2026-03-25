import pytest
from apps.api.metrics.service import MetricQueryService
from packages.db.models.metric import MetricSeries, MetricPoint
from packages.db.models.asset import Asset, AssetType
from packages.db.models.organization import Organization

@pytest.mark.asyncio
async def test_get_latest_metrics(db_session):
    # Setup data
    org = Organization(name="Test Org")
    asset = Asset(name="test-asset", type=AssetType.PHYSICAL_HOST, organization=org)
    series = MetricSeries(name="cpu.util", unit="%", asset=asset)
    db_session.add_all([org, asset, series])
    await db_session.commit()
    
    mp1 = MetricPoint(series_id=series.id, value=10.5)
    mp2 = MetricPoint(series_id=series.id, value=45.2) # Inserted second
    db_session.add_all([mp1, mp2])
    await db_session.commit()
    
    # Query service
    latest = await MetricQueryService.get_latest(db_session, str(asset.id))
    
    assert "cpu.util" in latest
    # The default descending sort by TS will pick the last one naturally in SQL
    assert latest["cpu.util"] == 45.2
