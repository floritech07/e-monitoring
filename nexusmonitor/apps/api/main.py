from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps.api.observability.telemetry import init_tracing, add_prometheus_middleware

from apps.api.auth.router import router as auth_router
from apps.api.assets.router import router as assets_router
from apps.api.metrics.router import router as metrics_router
from apps.api.alerts.router import router as alerts_router
from apps.api.dashboards.router import router as dashboards_router
from apps.api.network.router import router as network_router
from apps.api.actions.router import router as actions_router
from apps.api.correlation.router import router as correlation_router
from apps.api.notifications.router import router as notifications_router
from apps.api.reports.router import router as reports_router
from apps.api.ml.router import router as ml_router
from apps.api.integrations.cloud.router import router as cloud_router
from apps.api.integrations.legacy.router import router as legacy_router
from apps.api.health.router import router as health_router

app = FastAPI(
    title="NexusMonitor Enterprise API",
    description="Unified API backend for the Next-Gen Observability Platform",
    version="1.0.0",
)

# Telemetry
init_tracing(app)
add_prometheus_middleware(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(assets_router)
app.include_router(metrics_router)
app.include_router(alerts_router)
app.include_router(dashboards_router)
app.include_router(network_router)
app.include_router(actions_router)
app.include_router(correlation_router)
app.include_router(notifications_router)
app.include_router(reports_router)
app.include_router(ml_router)
app.include_router(cloud_router)
app.include_router(legacy_router)
