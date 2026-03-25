import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class AutoRemediationPolicy:
    """Evaluates Alert signatures to determine if a Runbook should trigger automatically."""
    
    def __init__(self, runbook_engine):
        self.runbook_engine = runbook_engine
        
    async def bind_alert_to_solution(self, alert_id: str, alert_name: str, asset_id: str) -> bool:
        """
        Maps known anomalies (e.g. Host Down, Disk Full) to an automated Runbook.
        For example: "Disk 95% Full" -> "Linux Clean Tmp/Apt Caches" runbook.
        """
        if "Disk" in alert_name and "Full" in alert_name:
            logger.info(f"Auto-Remediation matched {alert_name} on {asset_id}. Triggering Cleanup RUNBOOK_01")
            
            steps = [
                {"type": "ssh", "params": {"host": "mapped_host_ip", "user": "nexus", "command": "sudo rm -rf /var/cache/apt/archives/*"}}
            ]
            
            # Submits back directly to the engine
            await self.runbook_engine.execute_runbook("RUNBOOK_AUTO_CLEANUP", steps)
            return True
            
        return False
