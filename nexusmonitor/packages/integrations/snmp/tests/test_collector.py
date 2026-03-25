import pytest
from packages.integrations.snmp.collector import SnmpCollector
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_snmp_collector_auth_data():
    """Verify SnmpCollector correctly formulates pySNMP auth instances."""
    collector_v2 = SnmpCollector("192.168.1.1", version="v2c", community="public")
    auth_data = collector_v2._get_auth_data()
    # It should return a CommunityData instance
    assert hasattr(auth_data, "communityName")
    
    collector_v3 = SnmpCollector("192.168.1.1", version="v3", 
                                 v3_user="admin", v3_auth_key="pass1234", v3_priv_key="priv1234")
    auth_data = collector_v3._get_auth_data()
    # It should return a UsmUserData instance for v3
    assert hasattr(auth_data, "userName")
    assert str(auth_data.authKey) == "pass1234"
    assert str(auth_data.privKey) == "priv1234"

@pytest.mark.asyncio
@patch("packages.integrations.snmp.collector.getCmd", new_callable=AsyncMock)
async def test_snmp_get_mock(mock_getCmd):
    # Mocking pysnmp's complex return tuple: errorIndication, errorStatus, errorIndex, varBinds
    # We want successful response
    class MockVarBind:
        def prettyPrint(self): return "GigabitEthernet"
    
    mock_getCmd.return_value = (None, None, 0, [("1.3.6.1.2.1.2.2.1.2.1", MockVarBind())])
    
    col = SnmpCollector("10.0.0.1")
    result = await col.get("1.3.6.1.2.1.2.2.1.2.1")
    
    assert "error" not in result
    assert result["value"] == "GigabitEthernet"
