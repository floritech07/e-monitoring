from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from typing import List, Dict, Any
from pydantic import BaseModel
import time
from apps.collector.kafka_producer import producer_client
from apps.collector.otlp_parser import parse_otlp_json
from apps.collector.prom_remote_write_parser import parse_prom_remote_write

router = APIRouter(prefix="/ingest", tags=["ingestion"])

class CustomMetricBatch(BaseModel):
    asset_id: str
    points: List[Dict[str, Any]] # e.g. [{"name": "cpu.usage", "value": 45.3, "timestamp": 1700000000}]

@router.post("/custom")
async def ingest_custom_json(batch: CustomMetricBatch, background_tasks: BackgroundTasks):
    """Ingest custom JSON batch format."""
    normalized_points = []
    
    # Process batch in chunks if needed, here we process immediately
    for p in batch.points:
        point = {
            "asset_id": batch.asset_id,
            "metric_name": p.get("name"),
            "value": float(p.get("value", 0.0)),
            "timestamp": p.get("timestamp", int(time.time())),
            "labels": p.get("labels", {})
        }
        normalized_points.append(point)
        
    # Queue for ingestion
    if normalized_points:
        background_tasks.add_task(producer_client.send_batch, "metrics.raw", normalized_points)
        
    return {"status": "accepted", "count": len(normalized_points)}


@router.post("/otlp/v1/metrics")
async def ingest_otlp(request: Request, background_tasks: BackgroundTasks):
    """Accepts OpenTelemetry OTLP JSON format metrics."""
    try:
        data = await request.json()
        normalized_points = parse_otlp_json(data)
        if normalized_points:
            background_tasks.add_task(producer_client.send_batch, "metrics.raw", normalized_points)
        return {"status": "accepted", "count": len(normalized_points)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/v1/write")
async def ingest_prom_remote_write(request: Request, background_tasks: BackgroundTasks):
    """Accepts Prometheus remote_write protobuf format (Snappy compressed)."""
    try:
        # Read exact body bytes suitable for snappy decompression
        body = await request.body()
        normalized_points = parse_prom_remote_write(body)
        if normalized_points:
            background_tasks.add_task(producer_client.send_batch, "metrics.raw", normalized_points)
        return {"status": "accepted", "count": len(normalized_points)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
