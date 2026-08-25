import json
import os
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from ..models.camera import Camera
from ..models.vehicle import Vehicle
from ..models.event import VehicleEvent
from ..models.road_segment import RoadSegment
from ..models.registry import MockVehicleRegistry
from ..models.incident import Incident
from ..models.alert import Alert, AlertExplanation
from ..core.security import hash_plate
from .trajectory_service import TrajectoryService

class SeedService:
    @staticmethod
    def seed_initial_data(db: Session):
        candidate_dirs = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "sample_data")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample_data")),
            os.path.abspath("sample_data")
        ]
        sample_data_dir = next((d for d in candidate_dirs if os.path.exists(d)), candidate_dirs[0])
        
        # 1. Seed Cameras (F-01)
        if db.query(Camera).count() == 0:
            cam_path = os.path.join(sample_data_dir, "seed-cameras.json")
            if os.path.exists(cam_path):
                with open(cam_path, "r") as f:
                    cams_data = json.load(f)
                    for c in cams_data:
                        cam = Camera(
                            id=c["id"],
                            name=c["name"],
                            video_path=c.get("video_path"),
                            rtsp_url=c.get("rtsp_url"),
                            latitude=c["latitude"],
                            longitude=c["longitude"],
                            zone=c.get("zone", "Central Zone"),
                            road_segment=c.get("road_segment"),
                            status=c.get("status", "online"),
                            fps=c.get("fps", 25.0),
                            last_heartbeat=datetime.utcnow()
                        )
                        db.add(cam)
                    db.commit()

        # 2. Seed Road Segments
        if db.query(RoadSegment).count() == 0:
            seg_path = os.path.join(sample_data_dir, "seed-road-segments.json")
            if os.path.exists(seg_path):
                with open(seg_path, "r") as f:
                    segs = json.load(f)
                    for s in segs:
                        seg = RoadSegment(
                            id=s["id"],
                            name=s["name"],
                            zone=s.get("zone", "Central Zone"),
                            start_lat=s["start_lat"],
                            start_lng=s["start_lng"],
                            end_lat=s["end_lat"],
                            end_lng=s["end_lng"],
                            speed_limit_kmh=s.get("speed_limit_kmh", 50.0),
                            normal_direction_deg=s.get("normal_direction_deg", 90.0),
                            restricted_for=s.get("restricted_for", [])
                        )
                        db.add(seg)
                    db.commit()

        # 3. Seed Mock Vehicle Registry (F-17)
        if db.query(MockVehicleRegistry).count() == 0:
            reg_path = os.path.join(sample_data_dir, "mock-registry.json")
            if os.path.exists(reg_path):
                with open(reg_path, "r") as f:
                    regs = json.load(f)
                    for r in regs:
                        entry = MockVehicleRegistry(
                            plate_number=r["plate_number"],
                            registered_type=r["registered_type"],
                            registered_color=r["registered_color"],
                            owner_name=r.get("owner_name"),
                            registration_date=r.get("registration_date"),
                            status=r.get("status", "active")
                        )
                        db.add(entry)
                    db.commit()

        # 4. Seed Vehicles & Blacklist (F-09, F-11)
        if db.query(Vehicle).count() == 0:
            veh_path = os.path.join(sample_data_dir, "seed-vehicles.json")
            if os.path.exists(veh_path):
                with open(veh_path, "r") as f:
                    vehs = json.load(f)
                    for i, v in enumerate(vehs):
                        v_id = f"veh-seed-{i+1:02d}"
                        veh = Vehicle(
                            id=v_id,
                            plate_number=v["plate_number"],
                            plate_hash=hash_plate(v["plate_number"]),
                            vehicle_type=v.get("vehicle_type", "car"),
                            color=v.get("color", "White"),
                            is_blacklisted=v.get("is_blacklisted", False),
                            blacklist_reason=v.get("blacklist_reason"),
                            needs_review=False,
                            dna_embedding=v.get("dna_embedding"),
                            first_seen=datetime.utcnow() - timedelta(hours=2),
                            last_seen=datetime.utcnow()
                        )
                        db.add(veh)
                    db.commit()

        # 5. Seed Incidents (F-12)
        if db.query(Incident).count() == 0:
            inc_path = os.path.join(sample_data_dir, "seed-incidents.json")
            if os.path.exists(inc_path):
                with open(inc_path, "r") as f:
                    incs = json.load(f)
                    for inc_data in incs:
                        inc = Incident(
                            id=inc_data["id"],
                            vehicle_plate=inc_data.get("vehicle_plate"),
                            camera_id=inc_data["camera_id"],
                            incident_type=inc_data["incident_type"],
                            confidence=inc_data.get("confidence", 0.90),
                            severity=inc_data.get("severity", "medium"),
                            details=inc_data.get("details"),
                            evidence_url=inc_data.get("evidence_url"),
                            created_at=datetime.utcnow() - timedelta(minutes=random.randint(5, 45))
                        )
                        db.add(inc)
                    db.commit()

        # 6. Seed Multi-Camera Sighting Events and Trajectories
        if db.query(VehicleEvent).count() == 0:
            cameras = db.query(Camera).all()
            vehicles = db.query(Vehicle).all()
            now = datetime.utcnow()
            
            if cameras and vehicles:
                for v in vehicles:
                    # Create sequence of sightings across 2 to 4 cameras
                    num_sightings = random.randint(2, min(4, len(cameras)))
                    selected_cams = random.sample(cameras, num_sightings)
                    
                    for step_idx, cam in enumerate(selected_cams):
                        evt_time = now - timedelta(minutes=(num_sightings - step_idx) * 8)
                        evt_id = f"evt-seed-{v.id}-{step_idx+1}"
                        
                        paddle_conf = round(random.uniform(0.92, 0.98), 3)
                        easy_conf = round(random.uniform(0.90, 0.96), 3)
                        
                        evt = VehicleEvent(
                            id=evt_id,
                            vehicle_id=v.id,
                            camera_id=cam.id,
                            plate_text=v.plate_number,
                            confidence=paddle_conf,
                            fused_confidence=round((paddle_conf + easy_conf) / 2.0, 3),
                            plate_format_valid=True,
                            needs_review=False,
                            bbox=[180, 240, 520, 480],
                            vehicle_type=v.vehicle_type,
                            color=v.color,
                            speed_estimate=round(random.uniform(42.0, 68.0), 1),
                            ocr_engine_scores={
                                "paddle_ocr": {"text": v.plate_number, "conf": paddle_conf},
                                "easy_ocr": {"text": v.plate_number, "conf": easy_conf},
                                "char_agreement": 1.0,
                                "format_valid": True
                            },
                            snapshot_url=f"/static/snapshots/{cam.id}_{v.plate_number}.jpg",
                            latitude=cam.latitude,
                            longitude=cam.longitude,
                            timestamp=evt_time
                        )
                        db.add(evt)
                    db.commit()

                    # Build initial trajectory record for each vehicle
                    TrajectoryService.update_vehicle_trajectory(db, v.id)

                # Seed initial Alerts for blacklisted vehicles
                blacklisted_vehs = [v for v in vehicles if v.is_blacklisted]
                for bv in blacklisted_vehs:
                    alt_id = f"alt-seed-{bv.id}"
                    alert = Alert(
                        id=alt_id,
                        alert_type="blacklist_hit",
                        vehicle_id=bv.id,
                        plate_text=bv.plate_number,
                        camera_id="cam-01",
                        severity="critical",
                        message=f"Blacklist Hit: Flagged vehicle {bv.plate_number} detected. Reason: {bv.blacklist_reason}",
                        acknowledged=False,
                        timestamp=now - timedelta(minutes=12)
                    )
                    db.add(alert)

                    explanation = AlertExplanation(
                        id=f"exp-seed-{bv.id}",
                        alert_id=alt_id,
                        summary=f"Vehicle {bv.plate_number} flagged on hotlist database: {bv.blacklist_reason}. Verified by dual OCR engines.",
                        rules_triggered=[
                            {"rule_name": "Hotlist Database Match", "status": "TRIGGERED", "confidence": 1.0},
                            {"rule_name": "Dual-Engine OCR Agreement", "status": "PASS", "confidence": 0.97}
                        ],
                        contributing_factors={
                            "vehicle_type": bv.vehicle_type,
                            "color": bv.color,
                            "camera": "Connaught Place Radial-1"
                        },
                        evidence_urls=[f"/static/snapshots/cam-01_{bv.plate_number}.jpg"]
                    )
                    db.add(explanation)
                db.commit()
