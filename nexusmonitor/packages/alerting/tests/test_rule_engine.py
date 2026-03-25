import pytest
from packages.alerting.rule_engine import AlertRuleEngine
from packages.db.models.alert import AlertRule, Alert
from packages.db.models.asset import Asset, AssetType
from packages.db.models.organization import Organization
from packages.db.models.metric import MetricSeries, MetricPoint
import datetime

@pytest.mark.asyncio
async def test_evaluate_rule_triggers_alert(db_session):
    # Setup Engine
    engine = AlertRuleEngine()
    
    # Setup Data
    org = Organization(name="AlertOrg")
    asset = Asset(name="server-01", type=AssetType.PHYSICAL_HOST, organization=org)
    series = MetricSeries(name="disk.usage", asset=asset)
    db_session.add_all([org, asset, series])
    await db_session.commit()
    
    # Add violating metric point
    mp = MetricPoint(series_id=series.id, value=95.0, ts=datetime.datetime.now(datetime.timezone.utc))
    db_session.add(mp)
    
    # Create rule
    rule = AlertRule(
        name="High Disk Usage", 
        metric_expression="disk.usage",
        condition=">",
        threshold="90",
        severity="CRITICAL",
        duration_seconds=0, # fire immediately
        organization_id=org.id
    )
    db_session.add(rule)
    await db_session.commit()
    
    # Evaluate
    await engine.evaluate_rule(db_session, rule)
    
    # Check alert was created
    from sqlalchemy.future import select
    res = (await db_session.execute(select(Alert).where(Alert.rule_id == rule.id))).scalars().first()
    
    assert res is not None
    assert res.state == "FIRING"
    assert res.asset_id == asset.id
