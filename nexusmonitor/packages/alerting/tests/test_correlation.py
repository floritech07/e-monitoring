import pytest
from packages.alerting.correlation import CorrelationEngine
from packages.db.models.asset import Asset, AssetType
from packages.db.models.alert import Alert
from packages.db.models.organization import Organization

@pytest.mark.asyncio
async def test_is_correlated_suppresses_child(db_session):
    engine = CorrelationEngine()
    
    org = Organization(name="Corp")
    parent = Asset(name="host1", type=AssetType.PHYSICAL_HOST, organization=org)
    child = Asset(name="vm1", type=AssetType.VIRTUAL_MACHINE, organization=org, parent=parent)
    db_session.add_all([org, parent, child])
    await db_session.commit()
    
    # Assert child is NOT correlated when parent is healthy
    assert not await engine.is_correlated(db_session, str(child.id))
    
    # Make parent critical
    parent_alert = Alert(asset=parent, severity="CRITICAL", state="FIRING", message="Host Offline")
    db_session.add(parent_alert)
    await db_session.commit()
    
    # Assert child IS correlated now
    assert await engine.is_correlated(db_session, str(child.id)) is True
