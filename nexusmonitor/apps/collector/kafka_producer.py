import json
import logging
from aiokafka import AIOKafkaProducer
import os

logger = logging.getLogger(__name__)

class KafkaProducerClient:
    def __init__(self):
        self.brokers = os.getenv("KAFKA_BROKERS", "localhost:9092")
        self.producer = None

    async def start(self):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.brokers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        await self.producer.start()
        logger.info(f"Connected to Kafka brokers at {self.brokers}")

    async def stop(self):
        if self.producer:
            await self.producer.stop()
            logger.info("Kafka producer stopped.")

    async def send_batch(self, topic: str, metrics: list[dict]):
        """Send a batch of metrics to Kafka, keyed by asset_id (to ensure strict ordering per asset)."""
        if not self.producer:
            logger.warning("Kafka producer not initialized!")
            return False
            
        try:
            # Send points async and gather
            # Keying by asset_id ensures all points for an asset go to the same partition
            for point in metrics:
                asset_id = str(point.get("asset_id", "unknown"))
                await self.producer.send_and_wait(
                    topic, 
                    value=point,
                    key=asset_id.encode('utf-8')
                )
            return True
        except Exception as e:
            logger.error(f"Failed to produce metrics batch: {e}")
            return False

# Singleton instance to be used by the app
producer_client = KafkaProducerClient()
