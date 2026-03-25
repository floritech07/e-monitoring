import asyncio
import logging
from pysnmp.hlapi.asyncio import *

logger = logging.getLogger(__name__)

class SnmpCollector:
    """
    Async SNMP v2c/v3 Collector implementation covering core network telemetry.
    Supports authPriv and AES-256 natively via PySNMP.
    """
    
    def __init__(self, target_ip: str, port: int = 161, version: str = "v2c", community: str = "public", 
                 v3_user: str = None, v3_auth_key: str = None, v3_priv_key: str = None):
        self.target_ip = target_ip
        self.port = port
        self.version = version
        self.community = community
        
        self.v3_user = v3_user
        self.v3_auth_key = v3_auth_key
        self.v3_priv_key = v3_priv_key
        self.snmp_engine = SnmpEngine()

    def _get_auth_data(self):
        if self.version == "v3" and self.v3_user:
            return UsmUserData(
                self.v3_user,
                self.v3_auth_key,
                self.v3_priv_key,
                authProtocol=usmHMACSHAAuthProtocol,
                privProtocol=usmAesCfb256Protocol
            )
        return CommunityData(self.community)

    async def get(self, oid_str: str) -> dict:
        """Issue a single SNMP GET request asynchronously."""
        try:
            errorIndication, errorStatus, errorIndex, varBinds = await getCmd(
                self.snmp_engine,
                self._get_auth_data(),
                UdpTransportTarget((self.target_ip, self.port)),
                ContextData(),
                ObjectType(ObjectIdentity(oid_str))
            )
            
            if errorIndication:
                logger.error(f"SNMP Error: {errorIndication}")
                return {"error": str(errorIndication)}
            elif errorStatus:
                status = f"{errorStatus.prettyPrint()} at {errorIndex and varBinds[int(errorIndex) - 1][0] or '?'}"
                logger.error(f"SNMP Status Error: {status}")
                return {"error": status}
            else:
                for name, val in varBinds:
                    return {"oid": str(name), "value": val.prettyPrint()}
        except Exception as e:
            logger.error(f"SNMP Polling failed for {self.target_ip}: {e}")
            return {"error": str(e)}

    async def collect_system_metrics(self):
        """Pre-packaged method to fetch standard MIB-II attributes"""
        oids = [
            "1.3.6.1.2.1.1.1.0", # sysDescr
            "1.3.6.1.2.1.1.3.0", # sysUpTime
            "1.3.6.1.2.1.1.5.0", # sysName
        ]
        results = {}
        for oid in oids:
            res = await self.get(oid)
            if "value" in res:
                results[oid] = res["value"]
                
        return results
