from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import uuid
import json
import logging
import asyncio

from apps.api.websocket.hub import manager
from apps.api.websocket.auth import get_ws_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("/stream")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = None # Usually sent in query param or header for WS Auth
):
    # 1. Authenticate
    user_id = await get_ws_user(token)
    if not user_id:
        await websocket.close(code=1008, reason="Unauthorized")
        return
        
    connection_id = str(uuid.uuid4())
    
    # 2. Accept connection
    await manager.connect(websocket, user_id, connection_id)
    
    # Start heartbeat task
    async def heartbeat():
        try:
            while True:
                await asyncio.sleep(30)
                await websocket.send_text(json.dumps({"type": "ping"}))
        except asyncio.CancelledError:
            pass

    hb_task = asyncio.create_task(heartbeat())
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                await manager.handle_message(user_id, connection_id, message)
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received from WS {connection_id}")
    except WebSocketDisconnect:
        logger.info(f"WebSocket {connection_id} disconnected normally.")
    except Exception as e:
        logger.error(f"WebSocket {connection_id} encountered error: {e}")
    finally:
        hb_task.cancel()
        manager.disconnect(user_id, connection_id)
