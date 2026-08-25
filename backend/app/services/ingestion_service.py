import uuid
import difflib
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.camera import Camera
from ..models.vehicle import Vehicle
from ..models.event import VehicleEvent
from ..core.security import hash_plate
from ..core.event_bus import event_bus
from ..cv_pipeline.dna_extractor import extract_vehicle_dna_from_crop
from .trajectory_service import TrajectoryService
from .alert_service import AlertService
from .fake_plate_service import FakePlateService
from .incident_service import IncidentService

class IngestionService:
    @staticmethod
    def fuzzy_match_vehicle(db: Session, raw_plate: str, threshold: float = 0.90) -> Optional[Vehicle]:
        """
        F-05.2: Fuzzy plate match against existing vehicles;
        resolves duplicate sightings with slight OCR variation to the same vehicle_id.
        """
        if not raw_plate:
            return None
        
        # Exact match check first
        exact = db.query(Vehicle).filter(Vehicle.plate_number == raw_plate).first()
        if exact:
            return exact

        # Fuzzy similarity search across existing vehicles
        all_vehicles = db.query(Vehicle).all()
        for v in all_vehicles:
            sim = difflib.SequenceMatcher(None, raw_plate, v.plate_number).ratio()
            if sim >= threshold:
                return v

        return None

    @staticmethod
    async def process_ingestion_event(db: Session, payload: Dict[str, Any]) -> VehicleEvent:
        camera_id = payload.get("camera_id")
        raw_plate = payload.get("plate_text", "").strip().upper()
        
        camera = db.query(Camera).filter(Camera.id == camera_id).first()
        if not camera:
            # Fallback coordinates if camera not found
            lat, lng = 28.6139, 77.2090
        else:
            lat, lng = camera.latitude, camera.longitude

        # Resolve or create vehicle record
        vehicle = IngestionService.fuzzy_match_vehicle(db, raw_plate)
        is_new_vehicle = False
        
        if not vehicle:
            is_new_vehicle = True
            v_id = f"veh-{uuid.uuid4().hex[:8]}"
            plate_hash_val = hash_plate(raw_plate)
            dna_embed = extract_vehicle_dna_from_crop(
                None,
                vehicle_type=payload.get("vehicle_type", "car"),
                color=payload.get("color", "Unknown")
            )
            
            vehicle = Vehicle(
                id=v_id,
                plate_number=raw_plate,
                plate_hash=plate_hash_val,
                vehicle_type=payload.get("vehicle_type", "car"),
                color=payload.get("color", "Unknown"),
                is_blacklisted=False,
                needs_review=payload.get("needs_review", False),
                dna_embedding=dna_embed,
                first_seen=payload.get("timestamp") or datetime.utcnow(),
                last_seen=payload.get("timestamp") or datetime.utcnow()
            )
            db.add(vehicle)
            db.commit()
            db.refresh(vehicle)
        else:
            vehicle.last_seen = payload.get("timestamp") or datetime.utcnow()
            if payload.get("needs_review"):
                vehicle.needs_review = True
            db.add(vehicle)
            db.commit()

        # Persist vehicle event
        event_id = f"evt-{uuid.uuid4().hex[:10]}"
        event_timestamp = payload.get("timestamp") or datetime.utcnow()
        
        event = VehicleEvent(
            id=event_id,
            vehicle_id=vehicle.id,
            camera_id=camera_id,
            plate_text=raw_plate,
            confidence=payload.get("confidence", 0.95),
            fused_confidence=payload.get("fused_confidence", 0.95),
            plate_format_valid=payload.get("plate_format_valid", True),
            needs_review=payload.get("needs_review", False),
            bbox=payload.get("bbox"),
            vehicle_type=payload.get("vehicle_type", vehicle.vehicle_type),
            color=payload.get("color", vehicle.color),
            speed_estimate=payload.get("speed_estimate", 45.0),
            direction_vector=payload.get("direction_vector"),
            ocr_engine_scores=payload.get("ocr_engine_scores"),
            snapshot_url=payload.get("snapshot"),
            latitude=lat,
            longitude=lng,
            timestamp=event_timestamp
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # Trigger downstream checks asynchronously
        # 1. Update multi-camera trajectory (F-06)
        TrajectoryService.update_vehicle_trajectory(db, vehicle.id)

        # 2. Check Blacklist & Suspicious Geofence Alerts (F-09, F-19)
        await AlertService.evaluate_event_alerts(db, event, vehicle, camera)

        # 3. Check Fake / Tampered Plate Anomaly (F-17)
        await FakePlateService.evaluate_plate_integrity(db, event, vehicle, camera)

        # 4. Check Rule-based Incident Detection (F-12)
        await IncidentService.evaluate_event_incidents(db, event, camera)

        # 5. Broadcast to live-feed WebSocket
        broadcast_data = {
            "id": event.id,
            "vehicle_id": vehicle.id,
            "camera_id": camera_id,
            "camera_name": camera.name if camera else camera_id,
            "plate_text": raw_plate,
            "plate_hash": vehicle.plate_hash,
            "vehicle_type": event.vehicle_type,
            "color": event.color,
            "confidence": event.fused_confidence,
            "plate_format_valid": event.plate_format_valid,
            "needs_review": event.needs_review,
            "speed_estimate": event.speed_estimate,
            "is_blacklisted": vehicle.is_blacklisted,
            "latitude": lat,
            "longitude": lng,
            "snapshot_url": event.snapshot_url,
            "timestamp": event_timestamp.isoformat()
        }
        await event_bus.broadcast_vehicle_event(broadcast_data)

        return event
