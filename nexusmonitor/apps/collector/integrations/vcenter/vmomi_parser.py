from typing import Dict, Any

class VmomiParser:
    """Helper module to extract metrics from PyVmomi PerformanceManager responses."""
    
    @staticmethod
    def parse_perf_entity_metric(entity_metric_base: Any, lookup_map: Dict[int, str]) -> list[dict]:
        """
        Parses a vim.PerformanceManager.EntityMetricBase into a list of normalized
        timeseries points {"metric_name": x, "value": y, "timestamp": z}.
        """
        points = []
        try:
            # entity_metric.entity has the ManagedObject reference
            # For this parser we just iterate the values
            if not hasattr(entity_metric_base, 'value'):
                return points
                
            # Sample info contains timestamps
            sample_infos = getattr(entity_metric_base, "sampleInfo", [])
            
            for metric_series in getattr(entity_metric_base, "value", []):
                counter_id = metric_series.id.counterId
                instance = metric_series.id.instance
                
                # Resolve metric name (e.g. "cpu.usage.average")
                name = lookup_map.get(counter_id, f"unknown.{counter_id}")
                
                for idx, val in enumerate(metric_series.value):
                    if idx < len(sample_infos):
                        ts = sample_infos[idx].timestamp
                        int_ts = int(ts.timestamp())
                        points.append({
                            "metric_name": name,
                            "value": float(val),
                            "timestamp": int_ts,
                            "labels": {"instance": instance} if instance else {}
                        })
        except Exception as e:
            import logging
            logging.error(f"Failed parsing vmomi performance metrics: {e}")
            
        return points
