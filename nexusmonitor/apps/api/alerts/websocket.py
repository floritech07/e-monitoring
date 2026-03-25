from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import json
import asyncio

logger = logging.getLogger(__name__)

ws_router = APIRouter()

class ConnectionManager:
    """Manages active websockets for direct push integrations."""
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # Fire and forget json dumps
        payload = json.dumps(message)
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.error(f"Failed broadcasting WS: {e}")

manager = ConnectionManager()

@ws_router.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Client heartbeats or subs
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
