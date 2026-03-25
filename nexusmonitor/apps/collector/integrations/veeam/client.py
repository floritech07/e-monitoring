import httpx
import logging

logger = logging.getLogger(__name__)

class VeeamAPIClient:
    """Enterprise Manager REST API v1.1 Client stub for Veeam B&R."""
    
    def __init__(self, base_url: str, username: str, password: str, ssl_verify: bool = False):
        self.base_url = base_url.rstrip('/')
        self.username = username
        self.password = password
        self.ssl_verify = ssl_verify
        self.client = httpx.AsyncClient(verify=self.ssl_verify, timeout=30.0)
        self.token = None
        
    async def connect(self):
        """Authenticates to '/api/sessionMngr/'."""
        auth_url = f"{self.base_url}/api/sessionMngr/?v=v1_1"
        try:
            # Depending on the ENTMGR version, basic auth works or Base64 encode
            resp = await self.client.post(auth_url, auth=(self.username, self.password))
            resp.raise_for_status()
            
            # The token is usually contained in the X-RestSvcSessionId header
            self.token = resp.headers.get('X-RestSvcSessionId')
            if self.token:
                logger.info("Successfully authenticated to Veeam Enterprise Manager")
                # Ensure future requests use the token header
                self.client.headers.update({"X-RestSvcSessionId": self.token})
        except httpx.HTTPError as e:
            logger.error(f"Failed to authenticate with Veeam: {e}")
            raise
            
    async def get_jobs(self):
        """Fetches /api/jobs"""
        resp = await self.client.get(f"{self.base_url}/api/jobs")
        resp.raise_for_status()
        return resp.json().get('Refs', [])
        
    async def get_backup_sessions(self):
        """Fetches /api/backupSessions"""
        resp = await self.client.get(f"{self.base_url}/api/backupSessions")
        resp.raise_for_status()
        return resp.json().get('Refs', [])
        
    async def close(self):
        await self.client.aclose()
