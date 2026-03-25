import pytest
from apps.collector.integrations.vcenter.client import VCenterAPIClient
from apps.collector.integrations.vcenter.vmomi_parser import VmomiParser
import datetime

@pytest.mark.asyncio
async def test_vmomi_parser_extracts_metrics():
    # Construct a mock vim.PerformanceManager.EntityMetricBase response
    class MockSampleInfo:
        def __init__(self, ts):
            self.timestamp = ts
            
    class MockMetricSeries:
        def __init__(self, counter_id, vals):
            class ID: pass
            self.id = ID()
            self.id.counterId = counter_id
            self.id.instance = ""
            self.value = vals
            
    class MockEntityMetric:
        def __init__(self):
            now = datetime.datetime.now(datetime.timezone.utc)
            self.sampleInfo = [MockSampleInfo(now)]
            self.value = [
                MockMetricSeries(123, [4500]),
                MockMetricSeries(456, [99])
            ]
            
    # Test Parse
    lookup_map = {
        123: "cpu.usage.average",
        456: "mem.usage.average"
    }
    
    mock_entity = MockEntityMetric()
    points = VmomiParser.parse_perf_entity_metric(mock_entity, lookup_map)
    
    assert len(points) == 2
    
    cpu_point = next(p for p in points if p["metric_name"] == "cpu.usage.average")
    assert cpu_point["value"] == 4500.0
    
    mem_point = next(p for p in points if p["metric_name"] == "mem.usage.average")
    assert mem_point["value"] == 99.0

@pytest.mark.asyncio
async def test_vcenter_client_handles_no_pyvmomi(monkeypatch):
    """Ensure it fails gracefully if pyvmomi is absent."""
    # Temporarily remove pyVmomi from sys.modules
    import sys
    orig = sys.modules.get('pyVmomi')
    sys.modules['pyVmomi'] = None
    
    client = VCenterAPIClient("localhost", "u", "p")
    try:
        with pytest.raises(ImportError):
            await client.connect()
    finally:
        if orig:
            sys.modules['pyVmomi'] = orig
        else:
            del sys.modules['pyVmomi']
