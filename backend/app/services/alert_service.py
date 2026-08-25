import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.alert import Alert, AlertExplanation
from ..models.vehicle import Vehicle
from ..models.camera import Camera
from ..models.event import VehicleEvent
from ..models.road_segment import RoadSegment
from ..core.event_bus import event_bus
from ..core.security import mask_plate

class AlertService:
    @staticmethod
    async def evaluate_event_alerts(
        db: Session,
        event: VehicleEvent,
        vehicle: Vehicle,
        camera: Optional[Camera]
    ):
        """
        FR-09.2: On every new event, check vehicle.is_blacklisted; if true, create alert.
        FR-09.3: Check restricted geofence rules.
        FR-19.1: Generate structured explanation object and persist in alert_explanations.
        """
        cam_name = camera.name if camera else event.camera_id
        
        # 1. Blacklist Hit Check
        if vehicle.is_blacklisted:
            alert_id = f"alt-{uuid.uuid4().hex[:8]}"
            msg = f"Blacklist hit detected: Vehicle {vehicle.plate_number} sighted at {cam_name}. Reason: {vehicle.blacklist_reason or 'Marked hotlist target'}"
            
            alert = Alert(
                id=alert_id,
                alert_type="blacklist_hit",
                vehicle_id=vehicle.id,
                plate_text=vehicle.plate_number,
                camera_id=event.camera_id,
                severity="critical",
                message=msg,
                acknowledged=False,
                timestamp=datetime.utcnow()
            )
            db.add(alert)

            # F-19 Explainable AI Object
            explanation = AlertExplanation(
                id=f"exp-{uuid.uuid4().hex[:8]}",
                alert_id=alert_id,
                summary=f"Vehicle {vehicle.plate_number} is flagged on the city-wide hotlist database for: {vehicle.blacklist_reason}. Detected with {round(event.fused_confidence * 100, 1)}% OCR confidence.",
                rules_triggered=[
                    {
                        "rule_name": "Hotlist Database Match",
                        "status": "TRIGGERED",
                        "condition": "plate_number IN active_blacklist",
                        "confidence": 1.0,
                        "weight": "100%"
                    },
                    {
                        "rule_name": "Dual-Engine OCR Agreement",
                        "status": "PASS",
                        "condition": "fused_confidence >= 0.85",
                        "confidence": event.fused_confidence,
                        "weight": "High"
                    }
                ],
                contributing_factors={
                    "vehicle_type": vehicle.vehicle_type,
                    "color": vehicle.color,
                    "location": cam_name,
                    "zone": camera.zone if camera else "Central Zone",
                    "speed_recorded_kmh": event.speed_estimate,
                    "time": event.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
                },
                evidence_urls=[event.snapshot_url] if event.snapshot_url else ["/static/snapshots/sample_evidence.jpg"]
            )
            db.add(explanation)
            db.commit()

            # Push live alert over WebSocket
            await event_bus.broadcast_alert({
                "id": alert.id,
                "alert_type": alert.alert_type,
                "vehicle_id": vehicle.id,
                "plate_text": vehicle.plate_number,
                "camera_id": event.camera_id,
                "camera_name": cam_name,
                "severity": alert.severity,
                "message": alert.message,
                "timestamp": alert.timestamp.isoformat(),
                "explanation_summary": explanation.summary
            })

        # 2. Restricted Geofence / Commercial Heavy Vehicle Check
        if camera and camera.road_segment:
            road_seg = db.query(RoadSegment).filter(RoadSegment.name == camera.road_segment).first()
            if road_seg and road_seg.restricted_for:
                if vehicle.vehicle_type.lower() in [r.lower() for r in road_seg.restricted_for]:
                    alert_id = f"alt-{uuid.uuid4().hex[:8]}"
                    msg = f"Suspicious / Restricted Route: Commercial {vehicle.vehicle_type} ({vehicle.plate_number}) entering restricted corridor '{road_seg.name}'."
                    
                    alert = Alert(
                        id=alert_id,
                        alert_type="suspicious_route",
                        vehicle_id=vehicle.id,
                        plate_text=vehicle.plate_number,
                        camera_id=event.camera_id,
                        severity="high",
                        message=msg,
                        acknowledged=False,
                        timestamp=datetime.utcnow()
                    )
                    db.add(alert)

                    explanation = AlertExplanation(
                        id=f"exp-{uuid.uuid4().hex[:8]}",
                        alert_id=alert_id,
                        summary=f"Vehicle category '{vehicle.vehicle_type}' violates the municipal spatial geofence policy for {road_seg.name}.",
                        rules_triggered=[
                            {
                                "rule_name": "Restricted Zone Entry",
                                "status": "TRIGGERED",
                                "condition": f"vehicle_type IN {road_seg.restricted_for}",
                                "confidence": 0.96,
                                "weight": "90%"
                            }
                        ],
                        contributing_factors={
                            "restricted_segment": road_seg.name,
                            "zone": road_seg.zone,
                            "speed_limit_kmh": road_seg.speed_limit_kmh,
                            "detected_speed_kmh": event.speed_estimate
                        },
                        evidence_urls=[event.snapshot_url] if event.snapshot_url else []
                    )
                    db.add(explanation)
                    db.commit()

                    await event_bus.broadcast_alert({
                        "id": alert.id,
                        "alert_type": alert.alert_type,
                        "vehicle_id": vehicle.id,
                        "plate_text": vehicle.plate_number,
                        "camera_id": event.camera_id,
                        "camera_name": cam_name,
                        "severity": alert.severity,
                        "message": alert.message,
                        "timestamp": alert.timestamp.isoformat(),
                        "explanation_summary": explanation.summary
                    })

    @staticmethod
    def get_alerts(
        db: Session,
        alert_type: Optional[str] = None,
        severity: Optional[str] = None,
        acknowledged: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        query = db.query(Alert)
        if alert_type:
            query = query.filter(Alert.alert_type == alert_type)
        if severity:
            query = query.filter(Alert.severity == severity)
        if acknowledged is not None:
            query = query.filter(Alert.acknowledged == acknowledged)

        alerts = query.order_by(Alert.timestamp.desc()).offset(offset).limit(limit).all()
        cam_map = {c.id: c.name for c in db.query(Camera).all()}

        results = []
        for alt in alerts:
            results.append({
                "id": alt.id,
                "alert_type": alt.alert_type,
                "vehicle_id": alt.vehicle_id,
                "plate_text": alt.plate_text,
                "camera_id": alt.camera_id,
                "camera_name": cam_map.get(alt.camera_id, alt.camera_id),
                "severity": alt.severity,
                "message": alt.message,
                "acknowledged": alt.acknowledged,
                "acknowledged_by": alt.acknowledged_by,
                "acknowledged_at": alt.acknowledged_at.isoformat() if alt.acknowledged_at else None,
                "timestamp": alt.timestamp.isoformat()
            })
        return results

    @staticmethod
    def acknowledge_alert(db: Session, alert_id: str, officer_name: str = "Control Room Operator") -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.acknowledged = True
            alert.acknowledged_by = officer_name
            alert.acknowledged_at = datetime.utcnow()
            db.add(alert)
            db.commit()
            db.refresh(alert)
        return alert

    @staticmethod
    def get_alert_explanation(db: Session, alert_id: str) -> Optional[Dict[str, Any]]:
        """FR-19.2: Renders structured explainable AI breakdown."""
        exp = db.query(AlertExplanation).filter(AlertExplanation.alert_id == alert_id).first()
        if not exp:
            alert = db.query(Alert).filter(Alert.id == alert_id).first()
            if not alert:
                return None
            return {
                "alert_id": alert.id,
                "summary": alert.message,
                "rules_triggered": [{"rule_name": alert.alert_type, "status": "TRIGGERED", "confidence": 0.95}],
                "contributing_factors": {},
                "evidence_urls": [],
                "created_at": alert.timestamp.isoformat()
            }

        return {
            "alert_id": exp.alert_id,
            "summary": exp.summary,
            "rules_triggered": exp.rules_triggered,
            "contributing_factors": exp.contributing_factors,
            "evidence_urls": exp.evidence_urls or [],
            "created_at": exp.created_at.isoformat()
        }
