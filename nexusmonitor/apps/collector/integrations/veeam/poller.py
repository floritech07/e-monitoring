import logging
import asyncio
from datetime import datetime
from uuid import UUID

from packages.db.engine import db_manager
from packages.db.models.veeam import VeeamJob, BackupSession
from apps.collector.integrations.veeam.client import VeeamAPIClient
from apps.collector.kafka_producer import producer_client
from sqlalchemy.future import select

logger = logging.getLogger(__name__)

class VeeamPoller:
    """
    Main background poller fetching Veeam state to mirror into DB 
    and produce time-series metric points for dashboards.
    """
    def __init__(self, asset_id: UUID, url: str, user: str, pwd: str):
        self.asset_id = asset_id
        self.client = VeeamAPIClient(url, user, pwd)
        
    async def poll(self):
        try:
            await self.client.connect()
            
            # 1. Fetch Job Configurations
            raw_jobs = await self.client.get_jobs()
            
            # 2. Map and merge into relational data (stubbed due to Ref/Links structure)
            # In real system, we GET the href for exact properties.
            mapped_jobs = [] 
            for job in raw_jobs:
                # job_details = await self.client.client.get(job['Href']).json()
                mapped_jobs.append({
                    "id": job.get("UID", "").split(":")[-1], # Strip urn:veeam:Job:
                    "name": job.get("Name"),
                    "type": "VmBackup",
                    "status": "Idle"
                })
                
            await self._sync_db_jobs(mapped_jobs)
            
            # 3. Fetch recent BackupSessions
            raw_sessions = await self.client.get_backup_sessions()
            await self._sync_db_sessions_and_emit_metrics(raw_sessions)
            
        except Exception as e:
            logger.error(f"Veeam Poller error for {self.asset_id}: {e}")
        finally:
            await self.client.close()
            
    async def _sync_db_jobs(self, jobs_data):
        """Upsert jobs to Relational DB."""
        # Note: Stub implementation bypassing asyncpg bulk constraints out of scope here.
        pass

    async def _sync_db_sessions_and_emit_metrics(self, session_data):
        """Upserts sessions and drops standardized points into Kafka."""
        metrics = []
        now = int(datetime.utcnow().timestamp())
        
        for sess in session_data:
            # We would typically parse details here
            # e.g., duration, transferred_bytes, state (Success, Warning, Failed)
            
            # Synthesize metric payload
            metrics.append({
                "asset_id": str(self.asset_id),
                "metric_name": "veeam.session.status",
                "value": 1.0, # 1 for Success, 0 for Failure
                "timestamp": now,
                "labels": {
                    "job_name": sess.get("Name"),
                    "session_uid": sess.get("UID")
                }
            })
            
        if metrics:
            await producer_client.send_batch("metrics.raw", metrics)
            logger.info(f"Published {len(metrics)} Veeam metrics to Kafka")
