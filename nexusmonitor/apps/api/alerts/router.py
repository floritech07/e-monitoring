from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import uuid
import json

from packages.db.session import get_session
from packages.db.models.alert import Alert, AlertRule
from apps.api.alerts.schemas import AlertResponse, AlertRuleCreate, AlertRuleResponse

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("", response_model=List[AlertResponse])
async def list_active_alerts(
    session: AsyncSession = Depends(get_session),
    severity: Optional[str] = None,
    state: str = "FIRING"
):
    """Retrieve all active alerts, optionally filtered by severity."""
    stmt = select(Alert).where(Alert.state == state)
    if severity:
        stmt = stmt.where(Alert.severity == severity)
        
    result = await session.execute(stmt)
    return result.scalars().all()


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: uuid.UUID,
    session: AsyncSession = Depends(get_session)
    # current_user = Depends(get_current_user)
):
    """Acknowledge an alert to prevent further escalation."""
    alert = await session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    import datetime
    alert.acknowledged_at = datetime.datetime.now(datetime.timezone.utc)
    # alert.acknowledged_by = current_user.id
    await session.commit()
    
    # Broadcast ack event on redis here
    return {"status": "acknowledged", "alert_id": alert_id}


@router.get("/rules", response_model=List[AlertRuleResponse])
async def list_alert_rules(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(AlertRule))
    return result.scalars().all()


@router.post("/rules", response_model=AlertRuleResponse)
async def create_alert_rule(
    rule_in: AlertRuleCreate,
    session: AsyncSession = Depends(get_session)
):
    """Create a new metric evaluation rule."""
    db_rule = AlertRule(**rule_in.model_dump(), organization_id=uuid.uuid4()) # Mock org_id
    session.add(db_rule)
    await session.commit()
    await session.refresh(db_rule)
    return db_rule
