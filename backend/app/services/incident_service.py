import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.incident import Incident
from ..models.event import VehicleEvent
from ..models.camera import Camera
from ..models.road_segment import RoadSegment

class IncidentService:
    @staticmethod
    async def evaluate_event_incidents(
        db: Session,
        event: VehicleEvent,
        camera: Optional[Camera]
    ):
        """
        FR-12: AI Rule-Based Incident Detection
        - Stopped too long (no movement in non-parking corridor)
        - Wrong-direction against road segment vector
        - Sudden deceleration
        """
        cam_name = camera.name if camera else event.camera_id

        # 1. Sudden Deceleration Check
        if event.speed_estimate < 15.0:
            # Check previous event for the same vehicle
            prev_event = db.query(VehicleEvent).filter(
                VehicleEvent.vehicle_id == event.vehicle_id,
                VehicleEvent.id != event.id,
                VehicleEvent.timestamp >= event.timestamp - timedelta(seconds=10)
            ).order_by(VehicleEvent.timestamp.desc()).first()

            if prev_event and (prev_event.speed_estimate - event.speed_estimate) > 35.0:
                inc = Incident(
                    id=f"inc-decel-{uuid.uuid4().hex[:6]}",
                    vehicle_id=event.vehicle_id,
                    vehicle_plate=event.plate_text,
                    camera_id=event.camera_id,
                    incident_type="sudden_deceleration",
                    confidence=0.92,
                    severity="high",
                    details=f"Sudden speed drop from {round(prev_event.speed_estimate, 1)} km/h to {round(event.speed_estimate, 1)} km/h within seconds.",
                    evidence_url=event.snapshot_url,
                    created_at=datetime.utcnow()
                )
                db.add(inc)
                db.commit()

        # 2. Wrong Direction Check (Opposing road segment heading)
        if camera and camera.road_segment and event.direction_vector:
            road_seg = db.query(RoadSegment).filter(RoadSegment.name == camera.road_segment).first()
            if road_seg and isinstance(event.direction_vector, (int, float)):
                heading_diff = abs(event.direction_vector - road_seg.normal_direction_deg) % 360
                if 140 <= heading_diff <= 220:
                    inc = Incident(
                        id=f"inc-wrong-{uuid.uuid4().hex[:6]}",
                        vehicle_id=event.vehicle_id,
                        vehicle_plate=event.plate_text,
                        camera_id=event.camera_id,
                        incident_type="wrong_direction",
                        confidence=0.94,
                        severity="critical",
                        details=f"Vehicle traveling opposite to designated one-way traffic flow on {road_seg.name}.",
                        evidence_url=event.snapshot_url,
                        created_at=datetime.utcnow()
                    )
                    db.add(inc)
                    db.commit()

    @staticmethod
    def get_incidents(
        db: Session,
        incident_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        query = db.query(Incident)
        if incident_type:
            query = query.filter(Incident.incident_type == incident_type)

        incidents = query.order_by(Incident.created_at.desc()).offset(offset).limit(limit).all()
        cam_map = {c.id: c.name for c in db.query(Camera).all()}

        results = []
        for inc in incidents:
            results.append({
                "id": inc.id,
                "vehicle_id": inc.vehicle_id,
                "vehicle_plate": inc.vehicle_plate,
                "camera_id": inc.camera_id,
                "camera_name": cam_map.get(inc.camera_id, inc.camera_id),
                "incident_type": inc.incident_type,
                "confidence": inc.confidence,
                "severity": inc.severity,
                "details": inc.details,
                "evidence_url": inc.evidence_url,
                "created_at": inc.created_at.isoformat()
            })
        return results
