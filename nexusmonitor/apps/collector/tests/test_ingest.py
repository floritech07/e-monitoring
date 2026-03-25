from fastapi.testclient import TestClient
from apps.collector.main import app
import time

client = TestClient(app)

def test_ingest_custom_json():
    payload = {
        "asset_id": "bcf8a4c1-f2f7-4b71-9f93-5ec9e88d0115",
        "points": [
            {"name": "cpu.usage", "value": 45.2, "timestamp": int(time.time()), "labels": {"core": "0"}}
        ]
    }
    response = client.post("/ingest/custom", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "accepted"
    assert response.json()["count"] == 1

def test_otlp_json_parse():
    payload = {
      "resourceMetrics": [
        {
          "resource": {
            "attributes": [
              { "key": "host.name", "value": { "stringValue": "app-server-1" } }
            ]
          },
          "scopeMetrics": [
            {
              "metrics": [
                {
                  "name": "system.cpu.utilization",
                  "gauge": {
                    "dataPoints": [
                      { "asDouble": 0.85, "timeUnixNano": "1690850022000000000" }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
    response = client.post("/ingest/otlp/v1/metrics", json=payload)
    assert response.status_code == 200
    assert response.json()["count"] == 1
