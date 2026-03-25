from fastapi import FastAPI
import logging
from apps.collector.ingest_router import router as ingest_router
from apps.collector.kafka_producer import producer_client
import uvicorn

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="NexusMonitor Collector")

@app.on_event("startup")
async def startup_event():
    # Start the Kafka producer pool
    await producer_client.start()
    
@app.on_event("shutdown")
async def shutdown_event():
    await producer_client.stop()

app.include_router(ingest_router)

@app.get("/health")
def root():
    return {"status": "up", "service": "collector"}

if __name__ == "__main__":
    uvicorn.run("apps.collector.main:app", host="0.0.0.0", port=8001, reload=True)
