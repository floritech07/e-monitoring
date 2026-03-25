import pytest
from packages.integrations.nagios.status_parser import NagiosStatusParser

STATUS_DAT_SAMPLE = """
hoststatus {
    host_name=srv01
    current_state=1
    plugin_output=CRITICAL - Host unreachable
    last_check=1711363200
    problem_has_been_acknowledged=0
}

hoststatus {
    host_name=fw-core
    current_state=0
    plugin_output=OK - Host alive
    last_check=1711363201
    problem_has_been_acknowledged=0
}
"""

def test_parser_extracts_both_hosts():
    parser = NagiosStatusParser()
    records = parser.parse(STATUS_DAT_SAMPLE)
    assert len(records) == 2

def test_parser_maps_state_correctly():
    parser = NagiosStatusParser()
    records = parser.parse(STATUS_DAT_SAMPLE)
    
    srv01 = next(r for r in records if r["name"] == "srv01")
    fw_core = next(r for r in records if r["name"] == "fw-core")
    
    assert srv01["status"] == "DOWN"
    assert fw_core["status"] == "UP"

def test_parser_captures_plugin_output():
    parser = NagiosStatusParser()
    records = parser.parse(STATUS_DAT_SAMPLE)
    srv01 = next(r for r in records if r["name"] == "srv01")
    assert "unreachable" in srv01["plugin_output"].lower()

def test_parser_maps_source():
    parser = NagiosStatusParser()
    records = parser.parse(STATUS_DAT_SAMPLE)
    assert all(r["source"] == "nagios" for r in records)
