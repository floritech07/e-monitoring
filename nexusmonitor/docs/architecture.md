# NexusMonitor Enterprise Architecture

## Core Principles
1. **Async-First Execution**: All internal data ingestion streams across Python backend utilize `asyncio` loop handling, ensuring high throughput scaling using non-blocking I/O.
2. **Decoupled Monolithic Scale**: Monorepo split strictly between generic business libraries (`/packages`) and deployable scaling applications (`/apps`).
3. **Data Localization**: High-cardinality telemetry lands directly in `TimescaleDB` chunks natively optimized for temporal querying.

## System Topology
```mermaid
graph TD
  Z[Zabbix / PRTG] --> |Legacy Sync| A(API Service FastAPI)
  S[SNMP Traps] --> C(Collector Service)
  E[AWS/Azure APIs] --> A
  
  C --> K[Kafka Topic]
  A --> K
  
  K --> W(Celery Workers)
  W --> |Batch Inserts| DB[(TimescaleDB)]
  W --> |Cache/Locks| R[(Redis)]
  W --> |ML Triggers| ML[IsolationForest]
  
  F[React SPA Client] --> |WebSocket / REST| A
  A <--> DB
```

## Security Posture
- 100% Non-root constraints in all Dockerfile configurations.
- AES-256 for all SNMP v3 payloads.
- Role-based Access Control mapped to JWT assertions.
- Webhook HMAC SHA-256 verification.
- Vault-ready environments leveraging K8s ConfigMaps.
