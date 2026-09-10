from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime
from ...core.database import get_db
from ...schemas.citizen import CitizenReportCreate, CitizenReportOut, PublicStatsSummary
from ...models.citizen import CitizenReport
from ...models.camera import Camera
from ...models.event import VehicleEvent
from ...models.incident import Incident
from ...core.security import mask_plate

router = APIRouter(tags=["Citizen Portal & Public Transparency"])

@router.post("/report", response_model=CitizenReportOut, status_code=status.HTTP_201_CREATED, summary="Submit citizen suspicious vehicle / incident report")
def submit_citizen_report(payload: CitizenReportCreate, db: Session = Depends(get_db)):
    """FR-20.1: Citizen report submission endpoint."""
    report = CitizenReport(
        plate_text=payload.plate_text,
        vehicle_type=payload.vehicle_type,
        color=payload.color,
        location_description=payload.location_description,
        description=payload.description,
        photo_url=payload.photo_url,
        status="submitted",
        created_at=datetime.utcnow()
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

@router.get("/public/stats", response_model=PublicStatsSummary, summary="Get anonymized public city safety statistics")
def get_public_stats(db: Session = Depends(get_db)):
    """FR-20.2: Anonymized aggregate stats -- zero raw PII, all figures computed from real DB rows."""
    events_count = db.query(VehicleEvent).count()
    cameras_count = db.query(Camera).count()

    total_incidents = db.query(Incident).count()
    resolved_incidents = db.query(Incident).filter(Incident.status == "resolved").count()
    resolution_rate = round((resolved_incidents / total_incidents * 100), 1) if total_incidents else 0.0

    active_zones = db.query(Camera.zone).distinct().count() if hasattr(Camera, "zone") else cameras_count

    recent_events = db.query(VehicleEvent).order_by(VehicleEvent.timestamp.desc()).limit(8).all()
    masked_activity = []
    for e in recent_events:
        masked_activity.append({
            "masked_plate": mask_plate(e.plate_text),
            "vehicle_type": e.vehicle_type,
            "timestamp": e.timestamp.strftime("%H:%M:%S"),
            "status": "Monitored"
        })

    return PublicStatsSummary(
        monitored_vehicles_today=events_count,
        active_surveillance_zones=active_zones,
        corridor_interventions_count=total_incidents,
        incident_resolutions_rate=resolution_rate,
        safety_index_score=None,  # removed -- no honest basis to compute this without a defined formula
        masked_recent_activity=masked_activity
    )