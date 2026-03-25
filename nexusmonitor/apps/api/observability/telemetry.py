import time
import logging
from fastapi import FastAPI, Request, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
import os

logger = logging.getLogger(__name__)

# ─── Prometheus Metrics ─────────────────────────────────────────────────
REQUEST_COUNT = Counter(
    "nexus_http_requests_total",
    "Total HTTP requests handled",
    ["method", "endpoint", "status_code"]
)

REQUEST_LATENCY = Histogram(
    "nexus_http_request_duration_seconds",
    "HTTP request duration",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0]
)

ALERT_FIRED_COUNT = Counter(
    "nexus_alerts_fired_total",
    "Total alerts fired",
    ["severity"]
)

# ─── OpenTelemetry Setup ────────────────────────────────────────────────
def init_tracing(app: FastAPI) -> None:
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318/v1/traces")
    provider = TracerProvider()
    try:
        exporter = OTLPSpanExporter(endpoint=otlp_endpoint)
        provider.add_span_processor(BatchSpanProcessor(exporter))
    except Exception:
        logger.warning("OTLP exporter not reachable; tracing disabled.")
    trace.set_tracer_provider(provider)
    FastAPIInstrumentor.instrument_app(app)
    logger.info("OpenTelemetry tracing enabled")

# ─── Prometheus Middleware ──────────────────────────────────────────────
def add_prometheus_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def prometheus_middleware(request: Request, call_next):
        start = time.time()
        response: Response = await call_next(request)
        duration = time.time() - start
        endpoint = request.url.path
        
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=endpoint,
            status_code=response.status_code
        ).inc()
        
        REQUEST_LATENCY.labels(
            method=request.method,
            endpoint=endpoint
        ).observe(duration)
        
        return response

    @app.get("/metrics", include_in_schema=False)
    async def metrics_endpoint():
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
