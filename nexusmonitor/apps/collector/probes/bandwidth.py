import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class BandwidthProbe:
    """Calculates throughput (Mbps) using deltas from consecutive SNMP ifInOctets/ifOutOctets."""
    
    @staticmethod
    def calculate_mbps(current_octets: int, previous_octets: int, delta_seconds: float) -> float:
        """Delta algorithm mapping octet counters to Mbps"""
        if delta_seconds <= 0 or current_octets < previous_octets:
            # Handle counter rollover natively and non-zero Div
            return 0.0
            
        bytes_transferred = current_octets - previous_octets
        bits_transferred = bytes_transferred * 8
        mbps = bits_transferred / (delta_seconds * 1_000_000)
        return round(mbps, 3)
