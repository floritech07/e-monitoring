from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)

def test_cloud_providers_list(auth_headers):
    response = client.get("/integrations/cloud/providers", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "aws" in data["providers"]
    assert "azure" in data["providers"]

def test_legacy_systems_list(auth_headers):
    response = client.get("/integrations/legacy/systems", headers=auth_headers)
    assert response.status_code == 200
    assert "zabbix" in response.json()["systems"]
