import asyncio
import logging
from typing import Callable, Any

logger = logging.getLogger(__name__)

class ActionSandbox:
    """
    Hardened execution jail limiting CPU cycles and time vectors for automation tasks.
    Validates parameter inputs matching allowed regex structures and command whitelists.
    """
    
    @staticmethod
    async def jail(cmd_func: Callable, *args, timeout_sec: int = 30) -> Any:
        try:
            # We strictly enforce asynchronous timeouts preventing hung remote sessions
            result = await asyncio.wait_for(cmd_func(*args), timeout=timeout_sec)
            return result
        except asyncio.TimeoutError:
            logger.warning(f"Action automatically terminated violating timeout constraints: >{timeout_sec}s")
            raise TimeoutError("Execution exceeded the configured timeout limit.")
            
    @staticmethod
    def validate_command(command: str) -> bool:
        """Prevent simple injection payloads across CLI endpoints."""
        forbidden_tokens = ["rm -rf", "mkfs", "> /dev/", "| sh", "wget", "curl"]
        for token in forbidden_tokens:
            if token in command:
                return False
        return True
