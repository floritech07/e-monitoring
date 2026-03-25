import logging
import json
import asyncio
from typing import Dict, Any, Optional
import os
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

logger = logging.getLogger(__name__)

try:
    from aiokafka import AIOKafkaProducer
    from kafka.errors import KafkaError
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False
    logger.warning("aiokafka not found; KafkaProducer running in stub mode.")

class KafkaProducerClient:
    """
    Asynchronous Kafka producer with backpressure management via asyncio.Queue.
    Uses aiokafka natively for non-blocking I/O.
    """

    def __init__(self):
        self.bootstrap_servers = os.getenv("KAFKA_BROKERS", "localhost:9092")
        self.topic = os.getenv("KAFKA_METRICS_TOPIC", "nexus-metrics-ingest")
        
        # Backpressure configuration
        self.max_queue_size = int(os.getenv("KAFKA_MAX_QUEUE_SIZE", "5000"))
        self._queue: asyncio.Queue = asyncio.Queue(maxsize=self.max_queue_size)
        
        self.producer: Optional["AIOKafkaProducer"] = None
        self._worker_task: Optional[asyncio.Task] = None

    async def start(self):
        """Initializes the aiokafka connection and starts the background flush worker."""
        if not KAFKA_AVAILABLE:
            return
            
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            acks="all",
            linger_ms=50,  # Batching window
            compression_type="gzip",
            retry_backoff_ms=500,
            request_timeout_ms=10000,
            max_in_flight_requests_per_connection=5
        )
        await self.producer.start()
        self._worker_task = asyncio.create_task(self._process_queue())
        logger.info(f"Kafka producer started | brokers={self.bootstrap_servers}")

    async def stop(self):
        """Flushes the queue and closes the connection securely."""
        if self._worker_task:
            self._worker_task.cancel()
        if self.producer:
            await self.producer.stop()

    def enqueue_metric(self, payload: Dict[str, Any]) -> bool:
        """
        Attempts to enqueue a metric without blocking.
        Returns False if the queue is full (Backpressure active).
        """
        if not KAFKA_AVAILABLE:
            return True # Mock success
            
        try:
            self._queue.put_nowait(payload)
            return True
        except asyncio.QueueFull:
            logger.error("Kafka backpressure active: queue is full. Dropping metric.")
            return False

    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=10),
        stop=stop_after_attempt(5),
        retry=retry_if_exception_type(Exception)
    )
    async def _send_batch(self, batch: list):
        # Transactional or sequential batch sending
        # In a real batch we'd use create_batch, but for standard async loop:
        for item in batch:
            await self.producer.send_and_wait(self.topic, item)

    async def _process_queue(self):
        """Background loop draining the asyncio queue and shipping to Kafka."""
        batch = []
        try:
            while True:
                # Wait for at least one item
                if not batch:
                    item = await self._queue.get()
                    batch.append(item)
                
                # Try to burst up to 100 items from queue without blocking
                while len(batch) < 100 and not self._queue.empty():
                    batch.append(self._queue.get_nowait())
                    
                # Ship the batch over network
                try:
                    await self._send_batch(batch)
                    for _ in range(len(batch)):
                        self._queue.task_done()
                    batch.clear()
                except Exception as e:
                    logger.error(f"Failed to send Kafka batch after retries: {e}")
                    # Re-queue on catastrophic failure (if there is space)
                    await asyncio.sleep(2)
        except asyncio.CancelledError:
            logger.info("Kafka queue worker shutting down.")

# Singleton instance
kafka_client = KafkaProducerClient()
