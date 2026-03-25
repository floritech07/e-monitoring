import pytest
from packages.alerting.dispatcher import NotificationDispatcher
from packages.db.models.alert import Alert

@pytest.mark.asyncio
async def test_dispatcher_logs(caplog):
    import logging
    dispatcher = NotificationDispatcher()
    
    alert = Alert(
        id="123e4567-e89b-12d3-a456-426614174000",
        severity="WARNING",
        message="Test alert message",
        state="FIRING"
    )
    
    with caplog.at_level(logging.INFO):
        # Passing None for session as dispatcher mock uses it minimally
        await dispatcher.dispatch(None, alert)
        
    assert "DISPATCH: Alert" in caplog.text
    assert "WARNING" in caplog.text
