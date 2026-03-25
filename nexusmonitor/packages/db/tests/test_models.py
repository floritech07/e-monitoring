import pytest
from packages.db.models.organization import Organization
from packages.db.models.site import Site
from packages.db.models.asset import Asset, AssetType

@pytest.mark.asyncio
async def test_crud_organization(db_session):
    # Create
    org = Organization(name="Test Org", description="Test Description")
    db_session.add(org)
    await db_session.flush()
    
    assert org.id is not None
    assert org.created_at is not None
    
    # Read
    res = await db_session.get(Organization, org.id)
    assert res.name == "Test Org"
    
    # Update
    org.name = "Updated Org"
    await db_session.flush()
    res2 = await db_session.get(Organization, org.id)
    assert res2.name == "Updated Org"
    assert res2.updated_at >= res2.created_at

@pytest.mark.asyncio
async def test_relationships(db_session):
    org = Organization(name="Related Org")
    site = Site(name="Related Site", organization=org)
    asset = Asset(name="Test VM", type=AssetType.VIRTUAL_MACHINE, organization=org, site=site)
    
    db_session.add_all([org, site, asset])
    await db_session.commit()
    
    fetched_org = await db_session.get(Organization, org.id)
    # Note: we might need to load relationships explicitly with selectinload in real scenarios
    assert len(fetched_org.sites) == 1
    assert fetched_org.sites[0].name == "Related Site"
