from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)

def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_readyz_fails_without_db():
    response = client.get("/readyz")
    # Will fail connection to default postgres because test suite doesn't have it booted 
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "degraded"
