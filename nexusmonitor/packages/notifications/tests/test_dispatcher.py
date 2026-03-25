import pytest
from unittest.mock import AsyncMock, patch
from packages.notifications.dispatcher import NotificationDispatcher

@pytest.mark.asyncio
async def test_dispatcher_routes_email():
    dispatcher = NotificationDispatcher()
    alert = {"title": "Test", "severity": "HIGH", "asset_id": "a1", "site_id": "s1"}
    
    with patch.object(dispatcher.email, "send_alert_email", new_callable=AsyncMock) as mock_email:
        mock_email.return_value = True
        channels = [{"type": "email", "config": {"to": "admin@corp.local"}}]
        results = await dispatcher.dispatch(alert, channels)
        
    assert results["email"] is True
    mock_email.assert_called_once()

@pytest.mark.asyncio
async def test_dispatcher_routes_slack():
    dispatcher = NotificationDispatcher()
    alert = {"title": "Srv1 Down", "severity": "CRITICAL", "asset_id": "srv1", "site_id": "dc1"}
    
    with patch.object(dispatcher.slack, "send", new_callable=AsyncMock) as mock_slack:
        mock_slack.return_value = True
        channels = [{"type": "slack", "config": {"webhook_url": "https://hooks.slack.com/fake"}}]
        results = await dispatcher.dispatch(alert, channels)
        
    assert results["slack"] is True

@pytest.mark.asyncio
async def test_dispatcher_unknown_channel():
    dispatcher = NotificationDispatcher()
    alert = {"title": "x", "severity": "INFO"}
    results = await dispatcher.dispatch(alert, [{"type": "fax_machine", "config": {}}])
    assert results.get("fax_machine") is False

@pytest.mark.asyncio
async def test_dispatcher_multi_channel():
    dispatcher = NotificationDispatcher()
    alert = {"title": "Multi", "severity": "WARNING", "asset_id": "a1"}
    
    with patch.object(dispatcher.email, "send_alert_email", new_callable=AsyncMock, return_value=True), \
         patch.object(dispatcher.slack, "send", new_callable=AsyncMock, return_value=True):
        
        channels = [
            {"type": "email", "config": {"to": "ops@corp"}},
            {"type": "slack", "config": {"webhook_url": "https://hooks.slack.com/x"}}
        ]
        results = await dispatcher.dispatch(alert, channels)
        
    assert results["email"] is True
    assert results["slack"] is True
