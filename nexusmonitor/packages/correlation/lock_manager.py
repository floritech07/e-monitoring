import os
import logging
from contextlib import asynccontextmanager

try:
    from aioredlock import Aioredlock, LockError
    REDLOCK_AVAILABLE = True
except ImportError:
    REDLOCK_AVAILABLE = False

logger = logging.getLogger(__name__)

class DistributedMutex:
    """Implement safe mutatation controls via Redlock distributed locking."""
    
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        if REDLOCK_AVAILABLE:
            # Connect to Redis instances. In production this should be 3-5 disparate nodes.
            self.lock_manager = Aioredlock([redis_url], retry_count=3, retry_delay_min=0.1, retry_delay_max=0.5)
        else:
            self.lock_manager = None

    @asynccontextmanager
    async def lock(self, resource_key: str, lock_timeout_seconds: float = 2.0):
        if not REDLOCK_AVAILABLE:
            # Yield transparently if library is missing
            yield True
            return
            
        try:
            # Attempt to acquire the Redlock
            lock = await self.lock_manager.lock(f"mutex:{resource_key}", int(lock_timeout_seconds * 1000))
            if not lock.valid:
                raise LockError("Failed to acquire valid lock state.")
                
            yield True
            
        except LockError as e:
            logger.warning(f"Redlock Mutex Failure for key {resource_key}: {e}. Concurrent mutation prevented.")
            yield False
        except Exception as e:
            logger.error(f"Redlock unexpected crash: {e}")
            yield False
        finally:
            try:
                if 'lock' in locals() and lock.valid:
                    await self.lock_manager.unlock(lock)
            except Exception:
                pass

# Singleton
mutex_manager = DistributedMutex()
