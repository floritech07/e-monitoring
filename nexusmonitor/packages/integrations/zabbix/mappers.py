import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class ZabbixMapper:
    """Normalises raw Zabbix host objects to NexusMonitor Asset schema."""

    @staticmethod
    def host_to_asset(host: dict) -> Dict[str, Any]:
        interfaces = host.get("interfaces", [{}])
        ip = interfaces[0].get("ip", "") if interfaces else ""
        return {
            "source": "zabbix",
            "external_id": host.get("hostid"),
            "name": host.get("name") or host.get("host"),
            "ip_address": ip,
            "enabled": host.get("status") == "0",
        }

    @staticmethod
    def map_hosts(hosts: List[dict]) -> List[Dict[str, Any]]:
        return [ZabbixMapper.host_to_asset(h) for h in hosts]
