import asyncio
import logging
import time

logger = logging.getLogger(__name__)

async def tcp_connect(host: str, port: int, timeout_sec: float = 3.0) -> dict:
    """Asynchronous TCP Connect probe determining port availability."""
    start = time.time()
    try:
        conn = asyncio.open_connection(host, port)
        reader, writer = await asyncio.wait_for(conn, timeout=timeout_sec)
        writer.close()
        await writer.wait_closed()
        
        rtt_ms = (time.time() - start) * 1000
        return {
            "status": "OPEN",
            "latency_ms": rtt_ms
        }
    except asyncio.TimeoutError:
        return {"status": "TIMEOUT", "latency_ms": -1}
    except Exception as e:
        logger.debug(f"TCP connect refused for {host}:{port}")
        return {"status": "CLOSED", "latency_ms": -1}
