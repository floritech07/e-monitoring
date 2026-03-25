import asyncssh
import logging
from typing import Dict, Any
from packages.actions.executor import BaseActionImplementation, ActionResult
from packages.actions.sandbox import ActionSandbox

logger = logging.getLogger(__name__)

class SSHAction(BaseActionImplementation):
    """Executes bash/shell commands securely over SSH utilizing asyncssh lib."""
    
    async def execute(self, params: Dict[str, Any]) -> ActionResult:
        host = params.get("host")
        user = params.get("user")
        pwd = params.get("password")
        pkey = params.get("private_key")
        cmd = params.get("command")
        
        if not host or not user or not cmd:
            return ActionResult(success=False, output="", error="Missing host, user, or command")
            
        if not ActionSandbox.validate_command(cmd):
            return ActionResult(success=False, output="", error="Command blocked by sandbox policy")
            
        try:
            # Setting up simple client keys
            client_keys = [pkey] if pkey else ()
            password = pwd if pwd else ()
            
            async with asyncssh.connect(host, username=user, password=password, client_keys=client_keys, known_hosts=None) as conn:
                logger.info(f"SSH established to {host}, executing action...")
                
                # Exec cmd
                result = await conn.run(cmd, check=True)
                return ActionResult(success=True, output=result.stdout)
                
        except asyncssh.ProcessError as pe:
            logger.error(f"SSH Action returned non-zero code {pe.code} on {host}: {pe.stderr}")
            return ActionResult(success=False, output=pe.stdout or "", error=pe.stderr)
        except Exception as e:
            logger.error(f"SSH Action connection or general failure against {host}: {e}")
            return ActionResult(success=False, output="", error=str(e))
