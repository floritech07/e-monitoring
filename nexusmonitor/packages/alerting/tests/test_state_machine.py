import pytest
from packages.alerting.state_machine import AlertStateMachine
from packages.db.models.alert import AlertRule, Alert
from packages.db.models.asset import Asset
from packages.db.models.organization import Organization

@pytest.mark.asyncio
async def test_process_violation_immediate_firing(db_session):
    sm = AlertStateMachine()
    
    org = Organization(name="StOrg")
    asset = Asset(name="test", type="OTHER", organization=org)
    db_session.add_all([org, asset])
    await db_session.commit()
    
    rule = AlertRule(name="Rule", duration_seconds=0, 
                     metric_expression="mem", condition=">", threshold="80", 
                     severity="CRITICAL", organization_id=org.id)
    db_session.add(rule)
    await db_session.commit()

    await sm.process_violation(db_session, rule, str(asset.id), 90.0)
    
    from sqlalchemy.future import select
    res = (await db_session.execute(select(Alert).where(Alert.rule_id == rule.id))).scalars().first()
    
    assert res is not None
    assert res.state == "FIRING"

@pytest.mark.asyncio
async def test_resolve_alert(db_session):
    sm = AlertStateMachine()
    org = Organization(name="ResOrg")
    asset = Asset(name="testres", type="OTHER", organization=org)
    rule = AlertRule(name="R", duration_seconds=0, metric_expression="m", condition=">", threshold="1", severity="INFO", organization_id=org.id)
    alert = Alert(asset=asset, severity="INFO", message="abc", state="FIRING")
    
    db_session.add_all([org, asset, rule, alert])
    await db_session.commit()
    
    await sm.resolve_alert(db_session, alert)
    assert alert.state == "RESOLVED"
    assert alert.resolved_at is not None
