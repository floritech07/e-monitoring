from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from packages.db.models.asset import Asset
from packages.db.models.alert import Alert

class CorrelationEngine:
    async def is_correlated(self, session: AsyncSession, asset_id: str) -> bool:
        """
        Root cause correlation: if a parent asset (like an ESXi host or switch)
        is already CRITICAL, we suppress this child alert (VM on that host).
        """
        asset_stmt = select(Asset).where(Asset.id == asset_id)
        asset = (await session.execute(asset_stmt)).scalars().first()
        
        if asset and asset.parent_id:
            # Check if parent is CRITICAL
            parent_alert_stmt = select(Alert).where(
                Alert.asset_id == asset.parent_id,
                Alert.severity == "CRITICAL",
                Alert.state == "FIRING"
            )
            parent_crit = (await session.execute(parent_alert_stmt)).scalars().first()
            if parent_crit:
                return True # Suppress current alert, it's correlated
                
        return False
