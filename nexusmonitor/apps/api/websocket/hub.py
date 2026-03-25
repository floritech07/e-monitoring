import os
import json
import logging
import asyncio
from fastapi import WebSocket
from collections import defaultdict
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> dict(connection_id -> WebSocket)
        self.active_connections: dict[str, dict[str, WebSocket]] = defaultdict(dict)
        # Maps connection_id -> dict of filters
        self.subscriptions: dict[str, dict] = {}
        
        self.redis = None
        self.pubsub = None

    async def connect(self, websocket: WebSocket, user_id: str, connection_id: str):
        await websocket.accept()
        self.active_connections[user_id][connection_id] = websocket
        self.subscriptions[connection_id] = {
            "asset_ids": [],
            "metric_names": [],
            "severity_min": "INFO"
        }
        logger.info(f"WS client {user_id}:{connection_id} connected")

    def disconnect(self, user_id: str, connection_id: str):
        if user_id in self.active_connections and connection_id in self.active_connections[user_id]:
            del self.active_connections[user_id][connection_id]
        if connection_id in self.subscriptions:
            del self.subscriptions[connection_id]
        logger.info(f"WS client {user_id}:{connection_id} disconnected")

    async def handle_message(self, user_id: str, connection_id: str, message: dict):
        msg_type = message.get("type")
        
        if msg_type == "subscribe":
            filters = message.get("filters", {})
            self.subscriptions[connection_id].update(filters)
            logger.info(f"Updated subs for {connection_id}: {filters}")
            
        elif msg_type == "pong":
            # Heartbeat handled effectively at ASGI level, but we receive it here
            pass

    async def broadcast_to_user(self, user_id: str, message: str):
        """Send message to all connections of a specific user."""
        if user_id in self.active_connections:
            for conn_id, ws in self.active_connections[user_id].items():
                try:
                    await ws.send_text(message)
                except Exception as e:
                    logger.error(f"Error sending to {conn_id}: {e}")

    async def broadcast(self, event_type: str, payload: dict):
        """Fan-out to all connected clients respecting their subscriptions."""
        message_str = json.dumps({"type": event_type, "payload": payload})
        
        for user_id, conns in self.active_connections.items():
            for conn_id, ws in conns.items():
                subs = self.subscriptions.get(conn_id, {})
                
                # Filter logic (e.g., if metric.update and asset_id not in subs skip)
                if event_type == "metric.update":
                    if payload.get("asset_id") not in subs.get("asset_ids", []):
                        continue
                        
                try:
                    await ws.send_text(message_str)
                except Exception as e:
                    logger.error(f"Error sending to {conn_id}: {e}")

    async def listen_to_redis(self):
        """Background task bridging Redis PubSub to WebSockets."""
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        try:
            self.redis = redis.from_url(redis_url)
            self.pubsub = self.redis.pubsub()
            await self.pubsub.psubscribe("nm:*:*") # nm:org_id:event_type
            
            logger.info("Connected to Redis Pub/Sub for WS fan-out")
            
            async for message in self.pubsub.listen():
                if message["type"] == "pmessage":
                    channel = message["channel"].decode('utf-8')
                    event_type = channel.split(":")[-1] # "nm:org123:alert.fired" -> "alert.fired"
                    data = json.loads(message["data"])
                    
                    await self.broadcast(event_type, data)
        except Exception as e:
            logger.error(f"Redis WS bridge failed: {e}")

manager = ConnectionManager()
