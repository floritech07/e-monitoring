import csv
import io
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class CSVExporter:
    """Exports report tabular data into RFC 4180-compliant CSV string or bytes."""
    
    def export(self, rows: List[Dict[str, Any]], fieldnames: List[str] = None) -> bytes:
        if not rows:
            return b""
            
        if not fieldnames:
            fieldnames = list(rows[0].keys())
            
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
        
        csv_string = output.getvalue()
        logger.info(f"CSV export: {len(rows)} rows, {len(fieldnames)} columns")
        return csv_string.encode("utf-8")
