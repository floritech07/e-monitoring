import pytest
from packages.integrations.veeam.client import VeeamAPIClient
import httpx

@pytest.mark.asyncio
async def test_veeam_auth_success(respx_mock):
    # Mock HTTPX router handling the EntMgr auth endpoint
    auth_route = respx_mock.post("https://veeam.corp.local:9398/api/sessionMngr/?v=v1_1")
    auth_route.return_value = httpx.Response(201, headers={'X-RestSvcSessionId': 'VALID_TOKEN_123'})
    
    client = VeeamAPIClient("https://veeam.corp.local:9398", "admin", "pass")
    await client.connect()
    
    assert client.token == "VALID_TOKEN_123"
    assert "X-RestSvcSessionId" in client.client.headers
    await client.close()

@pytest.mark.asyncio
async def test_veeam_auth_failure(respx_mock):
    auth_route = respx_mock.post("https://veeam.corp.local:9398/api/sessionMngr/?v=v1_1")
    auth_route.return_value = httpx.Response(401, json={"message": "Unauthorized"})
    
    client = VeeamAPIClient("https://veeam.corp.local:9398", "admin", "wrong")
    with pytest.raises(httpx.HTTPStatusError):
        await client.connect()
    await client.close()

