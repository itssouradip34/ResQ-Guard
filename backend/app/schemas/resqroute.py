from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ResQRouteScenario(BaseModel):
    id: str
    name: str
    vehicle_id: str
    vehicle_plate: str
    vehicle_type: str
    origin: Dict[str, Any]
    destination: Dict[str, Any]
    normal_route: Dict[str, Any]
    optimized_resq_corridor: Dict[str, Any]

class EmergencyCorridorRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    emergency_type: str = "ambulance" # ambulance, fire_engine, police_escort

class EmergencyCorridorResponse(BaseModel):
    corridor_id: str
    emergency_type: str
    normal_travel_time_min: float
    optimized_travel_time_min: float
    time_saved_min: float
    time_saved_pct: float
    intersections_cleared_count: int
    waypoints: List[List[float]]
    cleared_signals: List[Dict[str, Any]]
