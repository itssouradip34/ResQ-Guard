from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...schemas.alert import AlertOut, AlertExplanationOut, AlertAcknowledgeRequest
from ...services.alert_service import AlertService
from ...core.security import get_role_context, RoleContext, mask_plate, log_audit_event

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertOut], summary="List live alerts with filtering and pagination")
def list_alerts(
    alert_type: Optional[str] = None,
    severity: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    role_ctx: RoleContext = Depends(get_role_context)
):
    """FR-09.4: Filterable and paginated real-time alert feed."""
    alerts = AlertService.get_alerts(db, alert_type, severity, acknowledged, limit, offset)
    
    if not role_ctx.is_authority:
        for a in alerts:
            if a.get("plate_text"):
                a["plate_text"] = mask_plate(a["plate_text"])
                
    return alerts

@router.post("/{alert_id}/acknowledge", response_model=AlertOut, summary="Acknowledge an open alert")
def acknowledge_alert(
    alert_id: str,
    body: Optional[AlertAcknowledgeRequest] = None,
    db: Session = Depends(get_db),
    role_ctx: RoleContext = Depends(get_role_context)
):
    """FR-09.5: Operator acknowledgment of alerts."""
    officer = body.acknowledged_by if body else "Control Room Officer"
    alert = AlertService.acknowledge_alert(db, alert_id, officer)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    log_audit_event(
        db,
        actor_role=role_ctx.role,
        action="acknowledge_alert",
        target_type="alert",
        target_id=alert.id
    )

    cam_name = alert.camera_id
    if alert.camera_id:
        from ...models.camera import Camera
        c = db.query(Camera).filter(Camera.id == alert.camera_id).first()
        if c:
            cam_name = c.name

    return AlertOut(
        id=alert.id,
        alert_type=alert.alert_type,
        vehicle_id=alert.vehicle_id,
        plate_text=alert.plate_text if role_ctx.is_authority else mask_plate(alert.plate_text),
        camera_id=alert.camera_id,
        camera_name=cam_name,
        severity=alert.severity,
        message=alert.message,
        acknowledged=alert.acknowledged,
        acknowledged_by=alert.acknowledged_by,
        acknowledged_at=alert.acknowledged_at,
        timestamp=alert.timestamp
    )

@router.get("/{alert_id}/explanation", response_model=AlertExplanationOut, summary="Explainable-AI breakdown for an alert")
def get_alert_explanation(alert_id: str, db: Session = Depends(get_db)):
    """
    FR-19.1 & FR-19.2: Explainable-AI Alert Panel
    Returns human-readable rule breakdowns, contributing factors, and evidence snapshots.
    """
    explanation = AlertService.get_alert_explanation(db, alert_id)
    if not explanation:
        raise HTTPException(status_code=404, detail="Alert explanation not found")
    return explanation
