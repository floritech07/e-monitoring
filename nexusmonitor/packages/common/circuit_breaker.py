import logging
from typing import Callable, Any
from functools import wraps

try:
    from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
except ImportError:
    # Fallback to no-op decorators if tenacity is not installed for some reason
    def retry(*args, **kwargs):
        def decorator(func):
            @wraps(func)
            async def wrapper(*fargs, **fkwargs):
                return await func(*fargs, **fkwargs)
            return wrapper
        return decorator
    def wait_exponential(*args, **kwargs): pass
    def stop_after_attempt(*args, **kwargs): pass
    def retry_if_exception_type(*args, **kwargs): pass

logger = logging.getLogger(__name__)

def safe_redis_call(fallback_value: Any = None):
    """
    Circuit breaker wrapper for Redis network calls.
    Fails safely instead of cascading 500 exceptions, returning the fallback_value.
    Includes Exponential backoff for temporal network limits.
    """
    def decorator(func: Callable):
        
        @retry(
            wait=wait_exponential(multiplier=0.5, min=0.5, max=2),
            stop=stop_after_attempt(3),
            retry=retry_if_exception_type(Exception),
            reraise=True  # We catch it manually below to enforce the fallback
        )
        async def _execute(*args, **kwargs):
            return await func(*args, **kwargs)
            
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await _execute(*args, **kwargs)
            except Exception as e:
                logger.warning(f"Circuit Breaker Open on Redis Call [{func.__name__}]: {e}. Returning fallback.")
                return fallback_value
        return wrapper
    return decorator
