# NexusMonitor Windows Boot Script
$env:PYTHONPATH = ".\"
$env:DB_ENGINE = "postgresql"
$env:DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/nexusmonitor"
$env:KAFKA_BROKERS = "localhost:9092"
$env:REDIS_URL = "redis://localhost:6379"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   Starting NexusMonitor Control Plane...    " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "-> Database schema step mocked for dev..." -ForegroundColor Green

Write-Host "-> To start services manually, open multiple terminals and run:" -ForegroundColor Yellow
Write-Host "  Terminal 1 (API): uvicorn apps.api.main:app --host 0.0.0.0 --port 8000"
Write-Host "  Terminal 2 (Collector): uvicorn apps.collector.main:app --host 0.0.0.0 --port 8001"
Write-Host "  Terminal 3 (Worker): celery -A apps.worker.celery_app worker -l info"

Write-Host "`nReady to rock!" -ForegroundColor Green
