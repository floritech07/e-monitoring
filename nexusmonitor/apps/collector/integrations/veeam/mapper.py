import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class VeeamDataMapper:
    """Provides mapping logic converting Veeam EntMgr formats into NexusMonitor internal models."""
    
    @staticmethod
    def map_backup_session(session_json: Dict[str, Any]) -> Dict[str, Any]:
        """
        Maps a Veeam Backup Session JSON node to a dict suitable for:
        - Metric payload generation
        - Database model updates 
        """
        # Session states in Veeam typical: Success, Warning, Failed, Working, Stopping
        result = session_json.get("Result", "Unknown")
        state = session_json.get("State", "Unknown")
        
        # Determine internal completion status
        status_enum = "FAILED"
        if result == "Success":
            status_enum = "SUCCESS"
        elif result == "Warning":
            status_enum = "WARNING"
        elif state in ["Working", "Starting"]:
            status_enum = "RUNNING"
            
        progress = float(session_json.get("Progress", 0))

        # Basic mapping
        return {
            "veeam_uid": session_json.get("UID", "").replace("urn:veeam:BackupSession:", ""),
            "job_uid": session_json.get("JobUid", "").replace("urn:veeam:Job:", ""),
            "name": session_json.get("Name", "Unknown Session"),
            "status": status_enum,
            "progress_percent": progress,
            "creation_time_utc": session_json.get("CreationTimeUTC"),
            "end_time_utc": session_json.get("EndTimeUTC")
        }

    @staticmethod
    def map_job(job_json: Dict[str, Any]) -> Dict[str, Any]:
        """Maps Veeam Job definition node."""
        return {
            "veeam_uid": job_json.get("UID", "").replace("urn:veeam:Job:", ""),
            "name": job_json.get("Name", "Unknown Job"),
            "job_type": job_json.get("JobType", "Unknown"),
            "status": job_json.get("Status", "Unknown")
        }
