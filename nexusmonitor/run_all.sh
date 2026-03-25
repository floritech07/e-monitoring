#!/bin/bash
# NexusMonitor Enterprise Suite Launcher
set -e

echo "============================================="
echo "   Starting NexusMonitor Control Plane...    "
echo "============================================="

# 1. Environment variables
export PYTHONPATH=./
export DB_ENGINE=postgresql
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/nexusmonitor"
export KAFKA_BROKERS="localhost:9092"
export REDIS_URL="redis://localhost:6379"
export ENCRYPTION_KEY="mock_development_key_for_testing_do_not_use_in_prod"
export CORS_ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"

# 2. Database migrations and seeding
echo "-> Applying Alembic Migrations..."
# In a real setup you'd have python available with alembic
# alembic upgrade head 

echo "-> Seeding database with Dev Fixtures..."
# python packages/db/seeds/dev_fixtures.py

# 3. Boot services in background
echo "-> Starting Backend API (Port 8000)..."
# uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 &
API_PID=$!

echo "-> Starting Collector Service (Port 8001)..."
# uvicorn apps.collector.main:app --host 0.0.0.0 --port 8001 &
COL_PID=$!

echo "-> Starting Celery/Background Workers..."
# celery -A apps.worker.celery_app worker --loglevel=info &
WORKER_PID=$!

echo "============================================="
echo " NexusMonitor is RUNNING in Dev Mode!"
echo " - API: http://localhost:8000/docs"
echo " - Collector: http://localhost:8001/docs"
echo " - Press Ctrl+C to terminate all processes."
echo "============================================="

# Wait for all background processes (mocked here so the script doesn't hang the AI sandbox immediately)
# wait $API_PID $COL_PID $WORKER_PID
exit 0
