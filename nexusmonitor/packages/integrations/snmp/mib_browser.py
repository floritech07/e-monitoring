class MibBrowser:
    """Utility class to resolve OIDs to human-readable names using PySMI."""
    
    def __init__(self, mib_paths: list[str] = None):
        self.mib_paths = mib_paths or []
        
    def translate(self, oid: str) -> str:
        """Parses OID to text. E.g., 1.3.6.1.2.1.1.5.0 -> sysName.0"""
        # Mock impl. Actual requires compiling MIB dicts.
        known_oids = {
            "1.3.6.1.2.1.1.1.0": "sysDescr",
            "1.3.6.1.2.1.2.2.1.10": "ifInOctets",
            "1.3.6.1.2.1.2.2.1.16": "ifOutOctets"
        }
        return known_oids.get(oid, oid)
