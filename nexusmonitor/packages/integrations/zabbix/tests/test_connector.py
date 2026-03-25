import pytest
from unittest.mock import AsyncMock, MagicMock
from packages.integrations.zabbix.connector import ZabbixConnector
from packages.integrations.zabbix.mappers import ZabbixMapper

@pytest.mark.asyncio
async def test_zabbix_connector_maps_problems():
    mock_client = MagicMock()
    mock_client.login = AsyncMock()
    mock_client.get_problems = AsyncMock(return_value=[
        {"eventid": "123", "name": "Host Down", "severity": "5", "objectid": "host-1"},
        {"eventid": "124", "name": "CPU High",  "severity": "3", "objectid": "host-2"},
    ])

    connector = ZabbixConnector(mock_client)
    alerts = await connector.sync()

    assert len(alerts) == 2
    assert alerts[0]["severity"] == "CRITICAL"
    assert alerts[1]["severity"] == "HIGH"
    assert alerts[0]["source"] == "zabbix"

def test_zabbix_mapper_host_to_asset():
    host = {
        "hostid": "10001",
        "host": "srv01",
        "name": "Production Server 01",
        "status": "0",
        "interfaces": [{"ip": "10.0.0.1"}]
    }
    asset = ZabbixMapper.host_to_asset(host)
    assert asset["name"] == "Production Server 01"
    assert asset["ip_address"] == "10.0.0.1"
    assert asset["enabled"] is True
    assert asset["source"] == "zabbix"
