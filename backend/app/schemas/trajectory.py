from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class TrajectoryPoint(BaseModel):
    camera_id: str
    camera_name: str
    latitude: float
    longitude: float
    timestamp: datetime
    speed_estimate: float

class TrajectoryOut(BaseModel):
    id: str
    vehicle_id: str
    plate_number: str
    vehicle_type: str
    color: str
    start_time: datetime
    end_time: datetime
    total_distance_km: float
    path_geojson: Dict[str, Any]
    camera_sequence: List[Dict[str, Any]]
    updated_at: datetime

    class Config:
        from_attributes = True

class PredictiveTrajectoryOut(BaseModel):
    vehicle_id: str
    plate_number: str
    current_camera_id: str
    current_camera_name: str
    predictions: List[Dict[str, Any]] # [{"next_camera_id": "...", "next_camera_name": "...", "probability": 0.72, "estimated_arrival_min": 4.5}]
