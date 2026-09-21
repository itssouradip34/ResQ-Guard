import os
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
import numpy as np
from sqlalchemy.orm import Session

from ..models.crime import CrimePoseEvent
from ..models.camera import Camera
from ..cv_pipeline.crime_pose_detector import crime_pose_detector
from ..core.event_bus import event_bus
from .trajectory_service import calculate_geo_distance
from .accident_detection_service import REGISTERED_POLICE_STATIONS

CRIME_SEVERITY_MAP = {
    "PHYSICAL_ASSAULT_SLAP": "HIGH",
    "WEAPON_KNIFE_DRAW": "CRITICAL",
    "MOLESTATION_STRUGGLE": "CRITICAL",
    "GROUP_BRAWL_FIGHT": "CRITICAL"
}

CRIME_EXPLANATIONS = {
    "PHYSICAL_ASSAULT_SLAP": "High-velocity upper-extremity kinetic swing toward target cranial node detected.",
    "WEAPON_KNIFE_DRAW": "Rapid waistline retrieval gesture followed by extended sharp weapon posture identified.",
    "MOLESTATION_STRUGGLE": "Abnormal inter-personal proximity collapse with opposing resistant torque vectors detected.",
    "GROUP_BRAWL_FIGHT": "Multi-person chaotic keypoint collision with multi-directional strike vectors."
}

class CrimeDetectionService:
    @staticmethod
    async def evaluate_camera_human_movements(
        db: Session,
        camera_id: str,
        keypoints_seq: Optional[np.ndarray] = None,
        person_count: int = 2,
        snapshot_url: Optional[str] = None
    ) -> Optional[CrimePoseEvent]:
        """
        Feature 4: Evaluates 17-keypoint human motion graphs and triggers Police Emergency SOS.
        """
        cam = db.query(Camera).filter(Camera.id == camera_id).first()
        cam_name = cam.name if cam else camera_id
        cam_lat = cam.latitude if cam else 28.6315
        cam_lng = cam.longitude if cam else 77.2167
        zone = cam.zone if cam else "Central Sector"

        eval_res = crime_pose_detector.evaluate_keypoint_sequence(keypoints_seq)

        if not eval_res["is_violent_crime"]:
            return None

        action = eval_res["action_type"]
        severity = CRIME_SEVERITY_MAP.get(action, "HIGH")
        explanation = CRIME_EXPLANATIONS.get(action, "Non-regulatory violent movement detected by pose-node tracking.")

        # Find nearest police station
        nearest_ps = min(
            REGISTERED_POLICE_STATIONS,
            key=lambda ps: calculate_geo_distance(cam_lat, cam_lng, ps["lat"], ps["lng"])
        )
        patrol_id = f"PCR-UNIT-{uuid.uuid4().hex[:4].upper()}"

        crime_event = CrimePoseEvent(
            id=f"crm-{uuid.uuid4().hex[:8]}",
            camera_id=camera_id,
            location_lat=cam_lat,
            location_lng=cam_lng,
            zone_name=zone,
            action_type=action,
            confidence=eval_res["confidence"],
            severity=severity,
            person_count=person_count,
            keypoint_nodes=keypoints_seq.tolist() if keypoints_seq is not None else [],
            joint_velocity_max=eval_res["joint_velocity_max"],
            proximity_collapse_ratio=eval_res["proximity_collapse_ratio"],
            evidence_crop_url=snapshot_url or f"/static/snapshots/{camera_id}_crime_evidence.jpg",
            explanation=explanation,
            police_sos_dispatched=True,
            dispatched_patrol_unit=f"{patrol_id} ({nearest_ps['name']})",
            nearest_police_station=nearest_ps["name"],
            status="OPEN",
            created_at=datetime.utcnow()
        )
        db.add(crime_event)
        db.commit()
        db.refresh(crime_event)

        # Broadcast live Police Crime SOS alert
        await event_bus.broadcast_alert({
            "id": f"alt-crime-{crime_event.id[:6]}",
            "alert_type": "violent_crime_human_sos",
            "camera_id": camera_id,
            "camera_name": cam_name,
            "severity": "critical",
            "message": f"🚨 HEIWA HUMAN SAFETY SOS: {action.replace('_', ' ')} detected at {cam_name}! {patrol_id} dispatched from {nearest_ps['name']}.",
            "timestamp": datetime.utcnow().isoformat(),
            "crime_event": {
                "action_type": action,
                "confidence": eval_res["confidence"],
                "explanation": explanation,
                "patrol_unit": crime_event.dispatched_patrol_unit,
                "evidence_url": crime_event.evidence_crop_url
            }
        })

        return crime_event

    @staticmethod
    def get_recent_crime_events(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns list of recent Heiwa human safety crime detections."""
        events = db.query(CrimePoseEvent).order_by(CrimePoseEvent.created_at.desc()).limit(limit).all()
        return [
            {
                "id": e.id,
                "camera_id": e.camera_id,
                "location_lat": e.location_lat,
                "location_lng": e.location_lng,
                "zone_name": e.zone_name,
                "action_type": e.action_type,
                "confidence": e.confidence,
                "severity": e.severity,
                "person_count": e.person_count,
                "explanation": e.explanation,
                "police_sos_dispatched": e.police_sos_dispatched,
                "dispatched_patrol_unit": e.dispatched_patrol_unit,
                "nearest_police_station": e.nearest_police_station,
                "status": e.status,
                "evidence_crop_url": e.evidence_crop_url,
                "created_at": e.created_at.isoformat()
            }
            for e in events
        ]
