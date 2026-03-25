import pytest
import asyncio
from apps.api.websocket.hub import ConnectionManager

class DummyWS:
    async def accept(self): pass
    async def send_text(self, data): self.last_sent = data

@pytest.mark.asyncio
async def test_ws_hub_subscribe_broadcast():
    manager = ConnectionManager()
    ws1 = DummyWS()
    
    await manager.connect(ws1, "user1", "conn1")
    assert "user1" in manager.active_connections
    
    # Subscribe to specific asset
    await manager.handle_message("user1", "conn1", {"type": "subscribe", "filters": {"asset_ids": ["assetA"]}})
    
    assert "assetA" in manager.subscriptions["conn1"]["asset_ids"]
    
    # Test filtering logic
    await manager.broadcast("metric.update", {"asset_id": "assetA", "value": 5})
    assert '"assetA"' in getattr(ws1, 'last_sent', '')
    
    # Send a metric update for assetB, ws1 shouldNOT get it
    ws1.last_sent = None
    await manager.broadcast("metric.update", {"asset_id": "assetB", "value": 10})
    assert ws1.last_sent is None
    
    # Test Alert fires universally (unfiltered for this assert)
    await manager.broadcast("alert.fired", {"message": "Critical error", "asset_id": "assetC"})
    assert '"alert.fired"' in ws1.last_sent
