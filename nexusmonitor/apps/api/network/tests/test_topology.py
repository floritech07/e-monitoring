from fastapi.testclient import TestClient
from apps.api.network.router import router
from fastapi import FastAPI

app = FastAPI()
# Override dependencies strictly to bypass token rules in simplistic testing
app.dependency_overrides = {} 
app.include_router(router)

client = TestClient(app)

def test_get_topology_format():
    """Verify endpoint maps correctly to D3/Pixi structure layout via schemas."""
    # We must patch the require_role dependencies or stub context
    from apps.api.auth.dependencies import require_role
    app.dependency_overrides[require_role] = lambda x: True
    app.dependency_overrides[require_role("VIEWER")] = lambda: "mock_user"
    
    response = client.get("/network/topology")
    assert response.status_code == 200
    
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert isinstance(data["nodes"], list)
    assert len(data["nodes"]) > 0
    assert data["nodes"][0]["id"] == "fw-01"
