# NexusMonitor API Documentation

## Authentication
All endpoints (except `/docs` and `/metrics`) require an `Authorization` header containing a valid Bearer JWT.

```bash
Authorization: Bearer <token>
```

## Endpoint Glossary

### Assets `/api/assets`
- `GET /api/assets` - Retrieve filtered telemetry assets.
- `GET /api/assets/{id}` - Details for an explicit asset.

### Network Topology `/api/network`
- `GET /api/network/topology` - PixiJS compatible node/edge JSON graph schema.

### Alerts `/api/alerts`
- `GET /api/alerts` - List active and historical alerts.
- `POST /api/alerts/{id}/acknowledge` - Update alert progression status.

### Telemetry `/api/metrics`
- `POST /api/metrics/ingest` - Push raw metric payload JSON.
- `GET /api/metrics/{asset_id}/{metric_key}` - Formatted time-series projection.

### ML & Diagnostics `/api/ml`
- `POST /api/ml/anomaly/detect` - Returns IsolationForest contamination likelihood scores.
- `POST /api/ml/forecast/capacity` - Predicts hardware saturation date/time.

*Note: The automatic OpenAPI specs are accessible via `/docs` and `/redoc` when the API cluster is live at `localhost:8000`.*
