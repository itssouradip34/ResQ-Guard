import math
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from collections import defaultdict
from sqlalchemy.orm import Session
from ..models.vehicle import Vehicle
from ..models.event import VehicleEvent
from ..models.trajectory import Trajectory
from ..models.camera import Camera
from ..core.config import settings

def calculate_geo_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes Haversine distance between two coordinates in kilometers."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c

class TrajectoryService:
    @staticmethod
    def update_vehicle_trajectory(db: Session, vehicle_id: str, window_hours: int = 4) -> Optional[Trajectory]:
        """
        FR-06.1: Groups vehicle events within a rolling time window ordered by event_time.
        FR-06.2: Builds a connected GeoJSON path LineString/MultiPoint linking camera sighting points.
        """
        now = datetime.utcnow()
        since_time = now - timedelta(hours=window_hours)
        
        events = db.query(VehicleEvent).filter(
            VehicleEvent.vehicle_id == vehicle_id,
            VehicleEvent.timestamp >= since_time
        ).order_by(VehicleEvent.timestamp.asc()).all()

        if not events:
            return None

        camera_map = {c.id: c for c in db.query(Camera).all()}
        
        camera_sequence = []
        coordinates = []
        total_dist = 0.0

        for i, evt in enumerate(events):
            cam = camera_map.get(evt.camera_id)
            cam_name = cam.name if cam else evt.camera_id
            
            camera_sequence.append({
                "camera_id": evt.camera_id,
                "camera_name": cam_name,
                "latitude": evt.latitude,
                "longitude": evt.longitude,
                "timestamp": evt.timestamp.isoformat(),
                "speed_estimate": evt.speed_estimate,
                "confidence": evt.fused_confidence
            })
            
            coordinates.append([evt.longitude, evt.latitude]) # GeoJSON [lng, lat]
            
            if i > 0:
                prev = events[i - 1]
                dist = calculate_geo_distance(prev.latitude, prev.longitude, evt.latitude, evt.longitude)
                total_dist += dist

        geom_type = "LineString" if len(coordinates) >= 2 else "Point"
        geom_coords = coordinates if geom_type == "LineString" else (coordinates[0] if coordinates else [77.2090, 28.6139])

        geojson_feature = {
            "type": "Feature",
            "geometry": {
                "type": geom_type,
                "coordinates": geom_coords
            },
            "properties": {
                "vehicle_id": vehicle_id,
                "total_points": len(coordinates),
                "total_distance_km": round(total_dist, 2),
                "start_time": events[0].timestamp.isoformat(),
                "end_time": events[-1].timestamp.isoformat()
            }
        }

        # Upsert into trajectories table
        traj = db.query(Trajectory).filter(Trajectory.vehicle_id == vehicle_id).first()
        if not traj:
            traj = Trajectory(
                id=f"traj-{uuid.uuid4().hex[:8]}",
                vehicle_id=vehicle_id,
                start_time=events[0].timestamp,
                end_time=events[-1].timestamp,
                path_geojson=geojson_feature,
                camera_sequence=camera_sequence,
                total_distance_km=round(total_dist, 2),
                updated_at=datetime.utcnow()
            )
            db.add(traj)
        else:
            traj.start_time = events[0].timestamp
            traj.end_time = events[-1].timestamp
            traj.path_geojson = geojson_feature
            traj.camera_sequence = camera_sequence
            traj.total_distance_km = round(total_dist, 2)
            traj.updated_at = datetime.utcnow()
            db.add(traj)

        db.commit()
        db.refresh(traj)
        return traj

    @staticmethod
    def get_vehicle_trajectory(db: Session, vehicle_id: str) -> Optional[Dict[str, Any]]:
        """FR-06.3: Returns the vehicle path as GeoJSON with detailed metadata."""
        traj = db.query(Trajectory).filter(Trajectory.vehicle_id == vehicle_id).first()
        if not traj:
            traj = TrajectoryService.update_vehicle_trajectory(db, vehicle_id)
            if not traj:
                return None

        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        return {
            "id": traj.id,
            "vehicle_id": traj.vehicle_id,
            "plate_number": vehicle.plate_number if vehicle else "UNKNOWN",
            "vehicle_type": vehicle.vehicle_type if vehicle else "car",
            "color": vehicle.color if vehicle else "Unknown",
            "start_time": traj.start_time.isoformat(),
            "end_time": traj.end_time.isoformat(),
            "total_distance_km": traj.total_distance_km,
            "path_geojson": traj.path_geojson,
            "camera_sequence": traj.camera_sequence,
            "updated_at": traj.updated_at.isoformat()
        }

    @staticmethod
    def predict_next_trajectory(db: Session, vehicle_id: str) -> Dict[str, Any]:
        """
        F-13: Predictive Vehicle Trajectory using a dynamic Markov transition matrix
        learned directly from all historical vehicle trajectories in the database.
        """
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            return {"error": "Vehicle not found"}

        # Get vehicle's latest event
        latest_event = db.query(VehicleEvent).filter(
            VehicleEvent.vehicle_id == vehicle_id
        ).order_by(VehicleEvent.timestamp.desc()).first()

        all_cameras = db.query(Camera).all()
        camera_map = {c.id: c for c in all_cameras}

        current_cam_id = latest_event.camera_id if latest_event else (all_cameras[0].id if all_cameras else "cam-01")
        current_cam = camera_map.get(current_cam_id)
        current_name = current_cam.name if current_cam else current_cam_id

        # 1. Learn Markov transition counts from historical events in the database
        transitions = defaultdict(lambda: defaultdict(int))
        all_events = db.query(VehicleEvent).order_by(VehicleEvent.vehicle_id, VehicleEvent.timestamp.asc()).all()

        for i in range(len(all_events) - 1):
            curr_e = all_events[i]
            next_e = all_events[i + 1]
            if curr_e.vehicle_id == next_e.vehicle_id and curr_e.camera_id != next_e.camera_id:
                transitions[curr_e.camera_id][next_e.camera_id] += 1

        observed_counts = transitions.get(current_cam_id, {})
        
        # 2. If observed transitions are sparse, calculate spatial neighbor probabilities
        candidate_scores = {}
        if current_cam:
            for other_cam in all_cameras:
                if other_cam.id == current_cam_id:
                    continue
                dist = calculate_geo_distance(current_cam.latitude, current_cam.longitude, other_cam.latitude, other_cam.longitude)
                # Closer cameras receive higher prior probability
                dist_score = 1.0 / max(0.5, dist)
                hist_count = observed_counts.get(other_cam.id, 0)
                # Combine historical sightings + spatial proximity
                combined_weight = (hist_count * 3.0) + dist_score
                candidate_scores[other_cam.id] = combined_weight

        total_weight = sum(candidate_scores.values()) or 1.0

        predictions = []
        for next_id, weight in sorted(candidate_scores.items(), key=lambda x: x[1], reverse=True)[:3]:
            prob = round(weight / total_weight, 3)
            nxt_cam = camera_map.get(next_id)
            
            dist_km = 2.0
            if current_cam and nxt_cam:
                dist_km = calculate_geo_distance(current_cam.latitude, current_cam.longitude, nxt_cam.latitude, nxt_cam.longitude)
            est_min = round(max(1.0, (dist_km / 45.0) * 60.0), 1)

            predictions.append({
                "next_camera_id": next_id,
                "next_camera_name": nxt_cam.name if nxt_cam else next_id,
                "next_zone": nxt_cam.zone if nxt_cam else "Central Zone",
                "probability": prob,
                "distance_km": round(dist_km, 2),
                "estimated_arrival_min": est_min
            })

        return {
            "vehicle_id": vehicle_id,
            "plate_number": vehicle.plate_number,
            "current_camera_id": current_cam_id,
            "current_camera_name": current_name,
            "predictions": predictions
        }
