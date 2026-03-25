import asyncio
import logging
from packages.db.engine import DatabaseManager
from packages.db.models.organization import Organization
from packages.db.models.site import Site
from packages.db.models.asset import Asset, AssetType

logger = logging.getLogger(__name__)

async def run_seeds():
    db_manager = DatabaseManager()
    
    async with db_manager.get_session() as session:
        # Check if already seeded
        result = await session.execute(Organization.__table__.select())
        if result.first():
            logger.info("Database already seeded.")
            return

        logger.info("Starting database seed with dev fixtures...")
        
        # Orgs
        orgs = [
            Organization(name="Corp HQ", description="Main Corporate Entity"),
            Organization(name="Acme Inc", description="Subsidiary"),
            Organization(name="Contoso Ltd", description="Acquired Company")
        ]
        session.add_all(orgs)
        await session.flush()
        
        # Sites
        sites = [
            Site(name="DataCenter East", location="New York", organization_id=orgs[0].id),
            Site(name="DataCenter West", location="San Francisco", organization_id=orgs[0].id),
            Site(name="Branch Office EMEA", location="London", organization_id=orgs[1].id),
            Site(name="Branch Office APAC", location="Tokyo", organization_id=orgs[1].id),
            Site(name="Cloud AWS", location="us-east-1", organization_id=orgs[2].id)
        ]
        session.add_all(sites)
        await session.flush()
        
        # Assets (Generating 10 per site = 50 assets)
        assets = []
        for s in sites:
            assets.append(Asset(name=f"{s.name}-router", type=AssetType.NETWORK_ROUTER, organization_id=s.organization_id, site_id=s.id, status="ONLINE", ip_address="10.0.0.1"))
            assets.append(Asset(name=f"{s.name}-sw", type=AssetType.NETWORK_SWITCH, organization_id=s.organization_id, site_id=s.id, status="ONLINE", ip_address="10.0.0.2"))
            assets.append(Asset(name=f"{s.name}-fw", type=AssetType.FIREWALL, organization_id=s.organization_id, site_id=s.id, status="ONLINE", ip_address="10.0.0.254"))
            
            for i in range(1, 4):
                assets.append(Asset(name=f"{s.name}-host-{i}", type=AssetType.PHYSICAL_HOST, organization_id=s.organization_id, site_id=s.id, status="ONLINE", ip_address=f"10.0.1.{i}"))
            
            for i in range(1, 5):
                assets.append(Asset(name=f"{s.name}-vm-{i}", type=AssetType.VIRTUAL_MACHINE, organization_id=s.organization_id, site_id=s.id, status="ONLINE", ip_address=f"10.0.2.{i}"))
                
        session.add_all(assets)
        await session.commit()
        logger.info(f"Seed complete: 3 Orgs, 5 Sites, {len(assets)} Assets generated.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_seeds())
