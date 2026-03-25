from fastapi import APIRouter
from datetime import datetime
import os

router = APIRouter(tags=["health"])

START_TIME = datetime.utcnow()

@router.get("/healthz", summary="Liveness probe")
async def healthz():
    """Kubernetes liveness probe — always returns 200 if process is alive."""
    return {"status": "ok", "ts": datetime.utcnow().isoformat()}

@router.get("/readyz", summary="Readiness probe")
async def readyz():
    """
    Kubernetes readiness probe — checks that critical upstream services are reachable.
    Returns 503 if any dependency is unavailable.
    """
    checks = {}
    
    # PostgreSQL check
    try:
        from packages.db.engine import engine
        async with engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as e:
        checks["postgres"] = f"error: {e}"
    
    # Redis check
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        await r.ping()
        await r.aclose()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {e}"
    
    ok = all(v == "ok" for v in checks.values())
    
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=200 if ok else 503,
        content={"status": "ready" if ok else "degraded", "checks": checks,
                 "uptime_seconds": (datetime.utcnow() - START_TIME).total_seconds()}
    )
