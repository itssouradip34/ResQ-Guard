from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class TrafficVolumeSeries(BaseModel):
    time_bucket: str # e.g. "14:00" or ISO
    volume: int
    by_type: Dict[str, int]
    by_camera: Dict[str, int]

class HeatmapZoneFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class HeatmapGeoJSON(BaseModel):
    type: str = "FeatureCollection"
    features: List[HeatmapZoneFeature]

class TrafficDashboardSummary(BaseModel):
    total_vehicles_today: int
    peak_hour: str
    peak_volume: int
    top_zone_by_volume: str
    top_zone_count: int
    active_cameras_count: int
    active_alerts_count: int
    vehicle_type_breakdown: Dict[str, int]
    hourly_series: List[TrafficVolumeSeries]
    avg_speed_kmh: float

class CongestionForecastOut(BaseModel):
    road_segment_id: str
    road_segment_name: str
    zone: str
    predicted_time: str
    predicted_level: str # low, medium, high, severe
    predicted_volume: int
    speed_impact_kmh: float
