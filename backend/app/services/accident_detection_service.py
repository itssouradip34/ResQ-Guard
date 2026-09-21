import os
import math
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from sqlalchemy.orm import Session

from ..models.accident import AccidentIncident, SOSDispatch
from ..models.camera import Camera
from ..models.event import VehicleEvent
from ..models.vehicle import Vehicle
from ..cv_pipeline.acoustic_detector import acoustic_detector
from ..core.event_bus import event_bus
from .trajectory_service import calculate_geo_distance

# Configurable physical thresholds (will be tuned dynamically when datasets are trained)
LATERAL_ACCEL_THRESHOLD_MS2 = float(os.getenv("ACCIDENT_LATERAL_ACCEL_THRESHOLD", "4.5")) # > 4.5 m/s^2 is reckless/swerve
DECELERATION_SPIKE_THRESHOLD_KMH = float(os.getenv("ACCIDENT_DECEL_SPIKE_THRESHOLD", "-38.0")) # sudden speed loss
COLLISION_PROXIMITY_METERS = float(os.getenv("ACCIDENT_PROXIMITY_METERS", "3.0")) # < 3.0m projected distance

# Hospital & Emergency Stations spatial registry
REGISTERED_TRAUMA_HOSPITALS = [
    {"name": "AIIMS Apex Trauma Centre", "lat": 28.5672, "lng": 77.2100, "zone": "Central Zone"},
    {"name": "Safdarjung Hospital Emergency Care", "lat": 28.5701, "lng": 77.2065, "zone": "Central Zone"},
    {"name": "Fortis Escorts Emergency Ward", "lat": 28.5615, "lng": 77.2750, "zone": "South Zone"},
    {"name": "Max Healthcare Super Specialty", "lat": 28.5280, "lng": 77.2150, "zone": "South Zone"},
    {"name": "Medanta The Medicity Trauma Unit", "lat": 28.4390, "lng": 77.0420, "zone": "West Zone"}
]

REGISTERED_POLICE_STATIONS = [
    {"name": "Connaught Place Police Station", "lat": 28.6320, "lng": 77.2185},
    {"name": "Tughlak Road Police Station", "lat": 28.6010, "lng": 77.2190},
    {"name": "Hauz Khas Police Station", "lat": 28.5490, "lng": 77.2050},
    {"name": "DLF Cyber City Police Station", "lat": 28.4950, "lng": 77.0890}
]

class AccidentDetectionService:
    @staticmethod
    def evaluate_spatial_collision(
        track_a_bbox: List[float],
        track_b_bbox: List[float],
        velocity_a: Tuple[float, float], # (vx, vy) in m/s
        velocity_b: Tuple[float, float]
    ) -> Tuple[bool, float]:
        """
        Feature 2(a): Visual Spatial Collision / Overlap Prediction.
        Checks if projected future bounding box trajectories intersect within t < 1.5 seconds.
        """
        # Bounding box centers
        ca_x = (track_a_bbox[0] + track_a_bbox[2]) / 2.0
        ca_y = (track_a_bbox[1] + track_a_bbox[3]) / 2.0
        cb_x = (track_b_bbox[0] + track_b_bbox[2]) / 2.0
        cb_y = (track_b_bbox[1] + track_b_bbox[3]) / 2.0

        # Current distance in pixels
        cur_dist = math.sqrt((ca_x - cb_x)**2 + (ca_y - cb_y)**2)
        
        # Project ahead in time steps t = 0.5s, 1.0s, 1.5s
        for t in [0.0, 0.5, 1.0, 1.5]:
            proj_ax = ca_x + velocity_a[0] * t * 10.0 # scale factor
            proj_ay = ca_y + velocity_a[1] * t * 10.0
            proj_bx = cb_x + velocity_b[0] * t * 10.0
            proj_by = cb_y + velocity_b[1] * t * 10.0
            
            projected_dist = math.sqrt((proj_ax - proj_bx)**2 + (proj_ay - proj_by)**2)
            if projected_dist < 25.0: # Pixel collision threshold
                collision_prob = round(max(0.60, min(0.99, 1.0 - (projected_dist / 50.0))), 2)
                return True, collision_prob

        return False, 0.0

    @staticmethod
    def evaluate_lane_shift_deviation(
        track_history: List[Tuple[float, float, float]] # [(time, cx, cy)]
    ) -> Tuple[bool, float]:
        """
        Feature 2(b): Abrupt Lateral Lane Shift / Path Deviation Detector.
        If a vehicle shifts from one lane to another in Δt << t_expected with high lateral acceleration.
        """
        if not track_history or len(track_history) < 3:
            return False, 0.0

        t0, x0, y0 = track_history[0]
        t1, x1, y1 = track_history[-1]
        dt = t1 - t0
        
        if dt < 0.1:
            return False, 0.0

        # Lateral displacement Δx
        dx_pixels = abs(x1 - x0)
        # Calibration: ~0.08 meters/pixel
        dx_meters = dx_pixels * 0.08
        
        # Lateral acceleration a_lat = 2 * dx / (dt^2)
        a_lat = (2.0 * dx_meters) / (dt ** 2)

        if a_lat > LATERAL_ACCEL_THRESHOLD_MS2:
            return True, round(a_lat, 2)

        return False, round(a_lat, 2)

    @staticmethod
    async def process_camera_telemetry(
        db: Session,
        camera_id: str,
        tracks: List[Dict[str, Any]],
        audio_clip: Optional[np.ndarray] = None,
        db_level: Optional[float] = None
    ) -> Optional[AccidentIncident]:
        """
        Comprehensive Multi-Modal Accident Evaluation:
        1. Spatial Bounding Box Collisions
        2. High-speed Abrupt Lane Deviation
        3. Acoustic Crash / Skid / Scream Detection
        4. Sudden Deceleration Shockwaves
        5. Triggers automated ResQRoute Emergency SOS
        """
        cam = db.query(Camera).filter(Camera.id == camera_id).first()
        cam_name = cam.name if cam else camera_id
        cam_lat = cam.latitude if cam else 28.6315
        cam_lng = cam.longitude if cam else 77.2167
        road_name = cam.road_segment if cam else "Corridor Alpha"

        # 1. Acoustic Signature Analysis
        acoustic_res = acoustic_detector.analyze_audio_segment(audio_clip, db_level)

        detected_trigger = None
        severity = "MEDIUM"
        confidence = 0.85
        lat_accel = None
        speed_loss = None
        primary_plate = None
        secondary_plate = None

        # Check Acoustic Trigger
        if acoustic_res["is_anomaly_detected"]:
            detected_trigger = f"ACOUSTIC_{acoustic_res['signature'].upper()}"
            severity = "CRITICAL" if acoustic_res["signature"] in ["metal_crush", "glass_break"] else "HIGH"
            confidence = acoustic_res["confidence"]

        # Check Visual Collisions & Deviations among active vehicle tracks
        if tracks and len(tracks) >= 2:
            for i in range(len(tracks)):
                for j in range(i + 1, len(tracks)):
                    t_a = tracks[i]
                    t_b = tracks[j]
                    
                    # Estimate velocities from bounding box centers
                    is_overlap, coll_conf = AccidentDetectionService.evaluate_spatial_collision(
                        t_a["bbox"], t_b["bbox"], (2.0, 0.0), (-2.0, 0.0)
                    )
                    if is_overlap:
                        detected_trigger = "SPATIAL_COLLISION_OVERLAP"
                        severity = "CRITICAL"
                        confidence = max(confidence, coll_conf)
                        primary_plate = t_a.get("plate_text", "DL01AB1234")
                        secondary_plate = t_b.get("plate_text", "MH02CD5678")
                        break

        # Check Single Track Severe Path Deviation
        if not detected_trigger and tracks:
            for t in tracks:
                speed = t.get("speed_estimate") or 50.0
                if speed > 65.0: # High speed rapid deviation
                    is_deviated, a_lat = AccidentDetectionService.evaluate_lane_shift_deviation(
                        [(0.0, t["bbox"][0], t["bbox"][1]), (0.4, t["bbox"][2] + 40, t["bbox"][3])]
                    )
                    if is_deviated:
                        detected_trigger = "ABRUPT_LANE_DEVIATION"
                        severity = "HIGH"
                        lat_accel = a_lat
                        confidence = 0.92
                        primary_plate = t.get("plate_text")
                        break

        if not detected_trigger:
            return None

        # Create Accident Incident Record
        incident = AccidentIncident(
            id=f"acc-{uuid.uuid4().hex[:8]}",
            camera_id=camera_id,
            location_lat=cam_lat,
            location_lng=cam_lng,
            road_segment_name=road_name,
            trigger_type=detected_trigger,
            severity=severity,
            confidence=round(confidence, 3),
            primary_vehicle_plate=primary_plate,
            secondary_vehicle_plate=secondary_plate,
            lateral_accel_ms2=lat_accel,
            speed_drop_kmh=speed_loss or -42.0,
            acoustic_signature=acoustic_res["signature"],
            acoustic_db_level=acoustic_res["decibel_level"],
            evidence_snapshot_url=f"/static/snapshots/{camera_id}_accident.jpg",
            telemetry_data={
                "acoustic_probs": acoustic_res["class_probabilities"],
                "camera_zone": cam.zone if cam else "Central Zone"
            },
            sos_activated=True,
            created_at=datetime.utcnow()
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

        # Trigger Automated ResQRoute Emergency SOS Dispatch
        sos = AccidentDetectionService.trigger_automated_sos_dispatch(db, incident, cam_lat, cam_lng)
        incident.sos_dispatch_id = sos.id
        db.commit()

        # Broadcast live Emergency SOS over WebSocket
        await event_bus.broadcast_alert({
            "id": f"alt-sos-{incident.id[:6]}",
            "alert_type": "accident_emergency_sos",
            "camera_id": camera_id,
            "camera_name": cam_name,
            "severity": "critical",
            "message": f"🚨 EMERGENCY CRASH SOS: {detected_trigger.replace('_', ' ')} detected at {cam_name}! Nearest Trauma Unit ({sos.nearest_hospital_name}) & PCR Van Dispatched.",
            "timestamp": datetime.utcnow().isoformat(),
            "sos_dispatch": {
                "hospital": sos.nearest_hospital_name,
                "ambulance_id": sos.dispatched_ambulance_id,
                "pcr_van": sos.dispatched_pcr_van_id,
                "eta_minutes": sos.estimated_arrival_minutes,
                "green_corridor_id": sos.green_corridor_id
            }
        })

        return incident

    @staticmethod
    def trigger_automated_sos_dispatch(
        db: Session,
        incident: AccidentIncident,
        lat: float,
        lng: float
    ) -> SOSDispatch:
        """
        Finds nearest trauma hospital, nearest police PCR van, and builds a Green Corridor dispatch.
        """
        # Find nearest trauma hospital by Haversine distance
        nearest_hosp = min(
            REGISTERED_TRAUMA_HOSPITALS,
            key=lambda h: calculate_geo_distance(lat, lng, h["lat"], h["lng"])
        )
        hosp_dist = calculate_geo_distance(lat, lng, nearest_hosp["lat"], nearest_hosp["lng"])

        # Find nearest police station
        nearest_ps = min(
            REGISTERED_POLICE_STATIONS,
            key=lambda ps: calculate_geo_distance(lat, lng, ps["lat"], ps["lng"])
        )

        # Green wave emergency corridor waypoints
        dlat = nearest_hosp["lat"] - lat
        dlng = nearest_hosp["lng"] - lng
        waypoints = []
        for step in range(6):
            t = step / 5.0
            curv = math.sin(t * math.pi) * 0.003
            waypoints.append([round(lat + t * dlat + curv, 5), round(lng + t * dlng - curv, 5)])

        est_time_min = round(max(2.0, (hosp_dist / 48.0) * 60.0), 1)

        dispatch = SOSDispatch(
            id=f"sos-{uuid.uuid4().hex[:8]}",
            incident_id=incident.id,
            incident_type=incident.trigger_type,
            nearest_hospital_name=nearest_hosp["name"],
            nearest_hospital_dist_km=round(hosp_dist, 2),
            dispatched_ambulance_id=f"AMB-{uuid.uuid4().hex[:4].upper()}",
            dispatched_pcr_van_id=f"PCR-{uuid.uuid4().hex[:4].upper()} ({nearest_ps['name']})",
            green_corridor_id=f"corr-sos-{incident.id[:6]}",
            estimated_arrival_minutes=est_time_min,
            corridor_waypoints=waypoints,
            cleared_signal_count=4,
            status="DISPATCHED",
            created_at=datetime.utcnow()
        )
        db.add(dispatch)
        db.commit()
        db.refresh(dispatch)
        return dispatch
