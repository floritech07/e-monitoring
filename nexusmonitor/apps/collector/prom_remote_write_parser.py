import logging
import time

logger = logging.getLogger(__name__)

def parse_prom_remote_write(snappy_compressed_body: bytes) -> list[dict]:
    """
    Parses Prometheus remote_write protobuf format.
    Requires 'snappy' and prometheus protobufs.
    In this stub for immediately runnable codebase, we try-catch the actual import
    so it fails gracefully if deps missing, returning mock parses.
    """
    try:
        import snappy
        # In a real deployed worker we'd parse the remote.proto
        # from prometheus_client metrics
        decompressed = snappy.uncompress(snappy_compressed_body)
        
        # Placeholder parsing structure 
        # points = []
        # for ts in WriteRequest.FromString(decompressed).timeseries:
        #    ...
        logger.info(f"Received {len(decompressed)} bytes of Prom remote_write data")
        return []
    except ImportError:
        logger.warning("python-snappy not installed, cannot decode prometheus remote_write")
        return []
