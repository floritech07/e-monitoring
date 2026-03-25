import logging
import time

def parse_otlp_json(payload: dict) -> list[dict]:
    """
    Parses OTLP v1 Metrics JSON.
    Returns list of normalised points: {asset_id, metric_name, value, timestamp, labels}
    """
    points = []
    resource_metrics = payload.get("resourceMetrics", [])
    
    for rm in resource_metrics:
        # Extract resource attributes (hostname etc) to determine asset_id
        resource_attrs = {kv["key"]: kv["value"].get("stringValue", "") 
                          for kv in rm.get("resource", {}).get("attributes", [])}
        
        # In a real app we map this resource to a known DB asset ID. 
        # Here we use 'host.name' as proxy or raw string
        asset_id = resource_attrs.get("host.id", resource_attrs.get("host.name", "unknown"))
        
        for sm in rm.get("scopeMetrics", []):
            for metric in sm.get("metrics", []):
                metric_name = metric.get("name")
                
                # Check metric type (Gauge, Sum, Histogram)
                if "gauge" in metric:
                    data_points = metric["gauge"].get("dataPoints", [])
                elif "sum" in metric:
                    data_points = metric["sum"].get("dataPoints", [])
                else:
                    continue # Skip histograms / summaries for simple parsing
                    
                for dp in data_points:
                    val = dp.get("asDouble", dp.get("asInt", 0.0))
                    ts = int(int(dp.get("timeUnixNano", time.time() * 1e9)) / 1e9)
                    
                    labels = {kv["key"]: kv["value"].get("stringValue", "") 
                              for kv in dp.get("attributes", [])}
                              
                    points.append({
                        "asset_id": asset_id,
                        "metric_name": metric_name,
                        "value": float(val),
                        "timestamp": ts,
                        "labels": labels
                    })
                    
    return points
