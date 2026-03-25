# NexusMonitor Enterprise Suite

NexusMonitor is an enterprise-grade monitoring stack serving as a unified observability and problem management platform, heavily inspired by Datadog and classic SolarWinds/VMware infrastructure paradigms.

## Architecture

At a high level, the system employs a multi-tier microservice architecture:
- **API Server** (FastAPI) handling RBAC, configuration and REST workflows.
- **Collector Stream** (FastAPI) handling high-throughput telemetry ingestion, buffering it immediately into Apache Kafka.
- **Async Workers** (Celery) executing automated reactions, ML modeling, integration polling, and batch-storing telemetry into TimescaleDB.
- **Frontend** (React, TypeScript, Vite) serving customized dashboards, Problem Consoles, and live WebSocket topology graph views.

## Quick Start

### 1. Environment

Copy the `.env.example` file:
```bash
cp .env.example .env
```
Fill in default keys via generation scripts located in `packages/db/seeds`.

### 2. Docker Compose

Boot the entire platform using `docker-compose`:
```bash
docker compose up -d
```
*This command starts PostgreSQL (TimescaleDB), Redis, Kafka, the API, the Web container, and background Workers.*

### 3. Verify System
Navigate to `http://localhost:5173` to access the Fronted Console.
Navigate to `http://localhost:8000/docs` to inspect the Control Plane API OpenAPI spec.
