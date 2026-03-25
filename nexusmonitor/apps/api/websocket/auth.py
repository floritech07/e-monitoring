import logging
from apps.api.auth.jwt import decode_token

logger = logging.getLogger(__name__)

async def get_ws_user(token: str) -> str | None:
    """Validates JWT for WebSocket connection since headers are tricker."""
    if not token:
        # For pure dev without auth enforcement, we create a mock pass
        import os
        if os.getenv("AUTH_DISABLED", "false") == "true":
            return "dev-mock-user-id"
        return None
        
    try:
        payload = decode_token(token)
        return payload.get("sub")
    except Exception as e:
        logger.warning(f"WS Auth failed: {e}")
        return None
