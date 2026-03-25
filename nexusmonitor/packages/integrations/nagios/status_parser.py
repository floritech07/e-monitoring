import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

STATUS_FIELDS = ["host_name", "current_state", "plugin_output", "last_check", "problem_has_been_acknowledged"]

class NagiosStatusParser:
    """
    Parses the legacy Nagios status.dat flat-file format into structured dicts.
    Used when HTTP CGI endpoint is unavailable.
    """

    def parse(self, status_dat_content: str) -> List[Dict[str, Any]]:
        records = []
        blocks = re.findall(r'hoststatus\s*\{(.+?)\}', status_dat_content, re.DOTALL)

        for block in blocks:
            record: Dict[str, Any] = {}
            for line in block.strip().splitlines():
                line = line.strip()
                if '=' in line:
                    k, _, v = line.partition('=')
                    k = k.strip()
                    if k in STATUS_FIELDS:
                        record[k] = v.strip()
            if "host_name" in record:
                records.append({
                    "source": "nagios",
                    "name": record.get("host_name"),
                    "status": self._map_state(record.get("current_state", "3")),
                    "plugin_output": record.get("plugin_output", ""),
                    "acknowledged": record.get("problem_has_been_acknowledged", "0") == "1",
                })
        logger.info(f"Nagios status.dat parsed: {len(records)} host records")
        return records

    @staticmethod
    def _map_state(state_code: str) -> str:
        return {"0": "UP", "1": "DOWN", "2": "UNREACHABLE"}.get(state_code, "UNKNOWN")
