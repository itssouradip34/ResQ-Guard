import uuid
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from ..models.event import VehicleEvent
from ..models.vehicle import Vehicle
from ..models.camera import Camera
from ..models.alert import Alert, AlertExplanation
from ..models.registry import MockVehicleRegistry, PlateIntegrityFlag
from ..cv_pipeline.dna_extractor import compute_cosine_similarity
from .trajectory_service import calculate_geo_distance
from ..core.event_bus import event_bus

class FakePlateService:
    @staticmethod
    async def evaluate_plate_integrity(
        db: Session,
        event: VehicleEvent,
        vehicle: Vehicle,
        camera: Optional[Camera]
    ):
        """
        F-17: Fake / Tampered / Stolen-Plate Detection
        """
        plate_str = event.plate_text.upper()
        cam_name = camera.name if camera else event.camera_id

        # 1. Mock Registry Vehicle Type / Color Mismatch (FR-17.1)
        registry_entry = db.query(MockVehicleRegistry).filter(
            MockVehicleRegistry.plate_number == plate_str
        ).first()

        if registry_entry:
            # Check vehicle type mismatch
            reg_type = registry_entry.registered_type.lower()
            detected_type = (event.vehicle_type or "car").lower()
            
            # Group equivalent types for safety
            is_type_mismatch = (reg_type != detected_type) and not (
                (reg_type in ["car", "suv"] and detected_type in ["car", "suv"])
            )

            if is_type_mismatch:
                flag = PlateIntegrityFlag(
                    event_id=event.id,
                    plate_number=plate_str,
                    flag_type="plate_vehicle_type_mismatch",
                    details={
                        "registered_type": reg_type,
                        "detected_type": detected_type,
                        "registered_color": registry_entry.registered_color,
                        "detected_color": event.color
                    },
                    created_at=datetime.utcnow()
                )
                db.add(flag)

                # Create Alert
                alert_id = f"alt-fake-{uuid.uuid4().hex[:6]}"
                alert = Alert(
                    id=alert_id,
                    alert_type="fake_plate_suspected",
                    vehicle_id=vehicle.id,
                    plate_text=plate_str,
                    camera_id=event.camera_id,
                    severity="critical",
                    message=f"Fake/Tampered Plate Suspected: Plate {plate_str} registered as '{reg_type}', but detected as '{detected_type}' at {cam_name}.",
                    acknowledged=False,
                    timestamp=datetime.utcnow()
                )
                db.add(alert)

                explanation = AlertExplanation(
                    id=f"exp-{uuid.uuid4().hex[:8]}",
                    alert_id=alert_id,
                    summary=f"National Registry Type Mismatch for plate {plate_str}: Registered class '{reg_type}' does not match visual detection '{detected_type}'.",
                    rules_triggered=[
                        {
                            "rule_name": "Registry Class Discrepancy",
                            "status": "TRIGGERED",
                            "confidence": 0.98,
                            "evidence": f"Expected: {reg_type}, Detected: {detected_type}"
                        }
                    ],
                    contributing_factors={
                        "registered_owner": registry_entry.owner_name or "N/A",
                        "registered_status": registry_entry.status,
                        "camera": cam_name
                    },
                    evidence_urls=[event.snapshot_url] if event.snapshot_url else []
                )
                db.add(explanation)
                db.commit()

                await event_bus.broadcast_alert({
                    "id": alert.id,
                    "alert_type": alert.alert_type,
                    "vehicle_id": vehicle.id,
                    "plate_text": plate_str,
                    "camera_id": event.camera_id,
                    "camera_name": cam_name,
                    "severity": alert.severity,
                    "message": alert.message,
                    "timestamp": alert.timestamp.isoformat(),
                    "explanation_summary": explanation.summary
                })
                return

        # 2. Impossible Travel / Duplicate Plate Across Distant Cameras (FR-17.2)
        recent_events = db.query(VehicleEvent).filter(
            VehicleEvent.plate_text == plate_str,
            VehicleEvent.id != event.id,
            VehicleEvent.timestamp >= event.timestamp - timedelta(minutes=15)
        ).order_by(VehicleEvent.timestamp.desc()).all()

        for prev_e in recent_events:
            time_delta_sec = abs((event.timestamp - prev_e.timestamp).total_seconds())
            if time_delta_sec < 1:
                time_delta_sec = 1
                
            dist_km = calculate_geo_distance(prev_e.latitude, prev_e.longitude, event.latitude, event.longitude)
            
            # Speed needed in km/h
            speed_kmh = (dist_km / (time_delta_sec / 3600.0))
            
            # If distance > 10km and implied speed > 180 km/h within 5 minutes -> Impossible Travel (Cloned Plate)
            if dist_km >= 5.0 and speed_kmh > 180.0:
                flag = PlateIntegrityFlag(
                    event_id=event.id,
                    plate_number=plate_str,
                    flag_type="duplicate_plate_multi_location",
                    details={
                        "distance_km": round(dist_km, 2),
                        "time_delta_sec": round(time_delta_sec, 1),
                        "implied_speed_kmh": round(speed_kmh, 1),
                        "camera_1": prev_e.camera_id,
                        "camera_2": event.camera_id
                    },
                    created_at=datetime.utcnow()
                )
                db.add(flag)

                alert_id = f"alt-clone-{uuid.uuid4().hex[:6]}"
                alert = Alert(
                    id=alert_id,
                    alert_type="fake_plate_suspected",
                    vehicle_id=vehicle.id,
                    plate_text=plate_str,
                    camera_id=event.camera_id,
                    severity="critical",
                    message=f"Impossible Travel / Cloned Plate Detected: Plate {plate_str} detected at two locations ({round(dist_km, 1)}km apart) within {int(time_delta_sec)} seconds ({round(speed_kmh)} km/h implied speed).",
                    acknowledged=False,
                    timestamp=datetime.utcnow()
                )
                db.add(alert)

                explanation = AlertExplanation(
                    id=f"exp-{uuid.uuid4().hex[:8]}",
                    alert_id=alert_id,
                    summary=f"Cloned Plate Anomaly: Vehicle plate {plate_str} sighted simultaneously across geographically distant sectors in an implausible timeframe.",
                    rules_triggered=[
                        {
                            "rule_name": "Impossible Travel Velocity Threshold",
                            "status": "TRIGGERED",
                            "confidence": 0.99,
                            "evidence": f"Calculated velocity {round(speed_kmh, 1)} km/h exceeds maximum physical corridor limit."
                        }
                    ],
                    contributing_factors={
                        "distance_between_cameras_km": round(dist_km, 2),
                        "elapsed_time_seconds": round(time_delta_sec, 1),
                        "camera_A": prev_e.camera_id,
                        "camera_B": event.camera_id
                    },
                    evidence_urls=[event.snapshot_url, prev_e.snapshot_url] if event.snapshot_url else []
                )
                db.add(explanation)
                db.commit()

                await event_bus.broadcast_alert({
                    "id": alert.id,
                    "alert_type": alert.alert_type,
                    "vehicle_id": vehicle.id,
                    "plate_text": plate_str,
                    "camera_id": event.camera_id,
                    "camera_name": cam_name,
                    "severity": alert.severity,
                    "message": alert.message,
                    "timestamp": alert.timestamp.isoformat(),
                    "explanation_summary": explanation.summary
                })
                break
