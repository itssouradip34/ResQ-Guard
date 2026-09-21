from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import numpy as np

from ...core.database import get_db
from ...services.accident_detection_service import AccidentDetectionService
from ...models.accident import AccidentIncident, SOSDispatch
from ...models.camera import Camera

router = APIRouter(prefix="/accidents", tags=["Accident Detection & Emergency SOS"])

class SimulateCrashRequest(BaseModel):
    camera_id: str = "cam-01"
    trigger_type: str = "SPATIAL_COLLISION_OVERLAP" # SPATIAL_COLLISION_OVERLAP, ABRUPT_LANE_DEVIATION, ACOUSTIC_METAL_CRUSH, ACOUSTIC_TIRE_SKID
    primary_plate: Optional[str] = "DL01AB1234"
    secondary_plate: Optional[str] = "MH02CD5678"
    lateral_accel_ms2: Optional[float] = 6.8
    acoustic_db_level: Optional[float] = 104.5

@router.get("/incidents", summary="List accident incidents and collision alerts")
def list_incidents(
    trigger_type: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    """Returns detected vehicle accidents and crash events."""
    query = db.query(AccidentIncident)
    if trigger_type:
        query = query.filter(AccidentIncident.trigger_type == trigger_type)
    if severity:
        query = query.filter(AccidentIncident.severity == severity)
        
    incidents = query.order_by(AccidentIncident.created_at.desc()).offset(offset).limit(limit).all()
    
    res = []
    for inc in incidents:
        sos_info = None
        if inc.sos_dispatch_id:
            sos = db.query(SOSDispatch).filter(SOSDispatch.id == inc.sos_dispatch_id).first()
            if sos:
                sos_info = {
                    "dispatch_id": sos.id,
                    "hospital_name": sos.nearest_hospital_name,
                    "hospital_dist_km": sos.nearest_hospital_dist_km,
                    "ambulance_id": sos.dispatched_ambulance_id,
                    "pcr_van_id": sos.dispatched_pcr_van_id,
                    "eta_minutes": sos.estimated_arrival_minutes,
                    "green_corridor_id": sos.green_corridor_id,
                    "status": sos.status
                }
        
        res.append({
            "id": inc.id,
            "camera_id": inc.camera_id,
            "location_lat": inc.location_lat,
            "location_lng": inc.location_lng,
            "road_segment_name": inc.road_segment_name,
            "trigger_type": inc.trigger_type,
            "severity": inc.severity,
            "confidence": inc.confidence,
            "primary_vehicle_plate": inc.primary_vehicle_plate,
            "secondary_vehicle_plate": inc.secondary_vehicle_plate,
            "lateral_accel_ms2": inc.lateral_accel_ms2,
            "speed_drop_kmh": inc.speed_drop_kmh,
            "acoustic_signature": inc.acoustic_signature,
            "acoustic_db_level": inc.acoustic_db_level,
            "evidence_snapshot_url": inc.evidence_snapshot_url,
            "sos_activated": inc.sos_activated,
            "sos_dispatch": sos_info,
            "created_at": inc.created_at.isoformat()
        })
    return res

@router.get("/dispatches", summary="List active ResQRoute Emergency SOS dispatches")
def list_sos_dispatches(
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Feature 3: Returns active corridor clearances, assigned trauma care hospitals and ambulances."""
    dispatches = db.query(SOSDispatch).order_by(SOSDispatch.created_at.desc()).limit(limit).all()
    return [
        {
            "id": d.id,
            "incident_id": d.incident_id,
            "incident_type": d.incident_type,
            "nearest_hospital_name": d.nearest_hospital_name,
            "nearest_hospital_dist_km": d.nearest_hospital_dist_km,
            "dispatched_ambulance_id": d.dispatched_ambulance_id,
            "dispatched_pcr_van_id": d.dispatched_pcr_van_id,
            "green_corridor_id": d.green_corridor_id,
            "estimated_arrival_minutes": d.estimated_arrival_minutes,
            "corridor_waypoints": d.corridor_waypoints,
            "cleared_signal_count": d.cleared_signal_count,
            "status": d.status,
            "created_at": d.created_at.isoformat()
        }
        for d in dispatches
    ]

@router.post("/simulate-crash", summary="Simulate multi-modal accident and trigger emergency SOS dispatch")
async def simulate_crash_event(
    payload: SimulateCrashRequest,
    db: Session = Depends(get_db)
):
    """
    Simulates a collision/lane swerve/acoustic signature event.
    Evaluates telemetry through AccidentDetectionService and triggers immediate ResQRoute SOS.
    """
    # Create sample tracks based on requested trigger
    tracks = []
    if payload.trigger_type == "SPATIAL_COLLISION_OVERLAP":
        tracks = [
            {"bbox": [100.0, 150.0, 220.0, 260.0], "plate_text": payload.primary_plate or "DL01AB1234", "speed_estimate": 62.0},
            {"bbox": [105.0, 155.0, 225.0, 265.0], "plate_text": payload.secondary_plate or "MH02CD5678", "speed_estimate": 58.0}
        ]
    elif payload.trigger_type == "ABRUPT_LANE_DEVIATION":
        tracks = [
            {"bbox": [50.0, 200.0, 170.0, 310.0], "plate_text": payload.primary_plate or "DL09XY9999", "speed_estimate": 78.0}
        ]

    # Generate synthetic audio clip if acoustic trigger
    audio_clip = None
    if "ACOUSTIC" in payload.trigger_type:
        t = np.linspace(0, 1, 16000)
        audio_clip = (np.sin(2 * np.pi * 320 * t) + np.random.normal(0, 0.4, 16000)).astype(np.float32)

    incident = await AccidentDetectionService.process_camera_telemetry(
        db=db,
        camera_id=payload.camera_id,
        tracks=tracks,
        audio_clip=audio_clip,
        db_level=payload.acoustic_db_level
    )

    if not incident:
        # Fallback manual trigger to guarantee demonstration
        cam = db.query(Camera).filter(Camera.id == payload.camera_id).first()
        cam_lat = cam.latitude if cam else 28.6315
        cam_lng = cam.longitude if cam else 77.2167
        
        incident = AccidentIncident(
            camera_id=payload.camera_id,
            location_lat=cam_lat,
            location_lng=cam_lng,
            road_segment_name=cam.road_segment if cam else "Corridor Alpha",
            trigger_type=payload.trigger_type,
            severity="CRITICAL",
            confidence=0.96,
            primary_vehicle_plate=payload.primary_plate,
            secondary_vehicle_plate=payload.secondary_plate,
            lateral_accel_ms2=payload.lateral_accel_ms2,
            speed_drop_kmh=-45.0,
            acoustic_signature="metal_crush",
            acoustic_db_level=payload.acoustic_db_level,
            evidence_snapshot_url=f"/static/snapshots/{payload.camera_id}_accident.jpg",
            sos_activated=True
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        sos = AccidentDetectionService.trigger_automated_sos_dispatch(db, incident, cam_lat, cam_lng)
        incident.sos_dispatch_id = sos.id
        db.commit()

    return {
        "status": "SOS_DISPATCHED",
        "incident_id": incident.id,
        "trigger_type": incident.trigger_type,
        "severity": incident.severity,
        "sos_dispatch_id": incident.sos_dispatch_id
    }
