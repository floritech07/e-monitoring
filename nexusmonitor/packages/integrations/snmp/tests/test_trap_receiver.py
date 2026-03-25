import pytest
import asyncio
from packages.integrations.snmp.trap_receiver import TrapReceiver
from unittest.mock import patch

@pytest.mark.asyncio
async def test_trap_receiver_startup():
    receiver = TrapReceiver("127.0.0.1", 162)
    # The run implementation just binds and sleeps in stub. Verify no exceptions thrown.
    task = asyncio.create_task(receiver.run())
    await asyncio.sleep(0.2)
    
    assert not task.done() or task.exception() is None
    task.cancel()
