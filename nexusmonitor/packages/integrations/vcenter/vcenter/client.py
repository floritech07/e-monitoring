import logging
import ssl

logger = logging.getLogger(__name__)

class VCenterAPIClient:
    def __init__(self, host: str, user: str, pwd: str, no_ssl_verify: bool = True):
        self.host = host
        self.user = user
        self.pwd = pwd
        self.no_ssl_verify = no_ssl_verify
        self.si = None
        self.context = None

    async def connect(self):
        """Uses pyVim to establish a session to vSphere."""
        try:
            from pyVim.connect import SmartConnect, Disconnect
            import pyVmomi
            
            if self.no_ssl_verify:
                self.context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
                self.context.check_hostname = False
                self.context.verify_mode = ssl.CERT_NONE
            else:
                self.context = ssl.create_default_context()
                
            # Note: pyVim connect is synchronous. Wrapped here for signature matching.
            # In a true asyncio app we would run this in a threadpool
            def sync_connect():
                return SmartConnect(
                    host=self.host,
                    user=self.user,
                    pwd=self.pwd,
                    sslContext=self.context
                )
            
            import asyncio
            self.si = await asyncio.to_thread(sync_connect)
            logger.info(f"Successfully connected to vCenter at {self.host}")
            
        except ImportError:
            logger.error("pyvmomi not installed. Cannot connect to vCenter.")
            raise
        except Exception as e:
            logger.error(f"Failed to connect to vCenter: {e}")
            raise

    async def get_performance_manager(self):
        if not self.si:
            raise ValueError("Not connected")
        return self.si.content.perfManager

    async def get_root_folder(self):
        if not self.si:
            raise ValueError("Not connected")
        return self.si.content.rootFolder

    async def close(self):
        if self.si:
            try:
                from pyVim.connect import Disconnect
                import asyncio
                await asyncio.to_thread(Disconnect, self.si)
                logger.info("vCenter connection closed")
            except Exception:
                pass
            finally:
                self.si = None
