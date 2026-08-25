from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class CitizenReportCreate(BaseModel):
    plate_text: Optional[str] = None
    vehicle_type: Optional[str] = "car"
    color: Optional[str] = "Unknown"
    location_description: str
    description: str
    photo_url: Optional[str] = None

class CitizenReportOut(CitizenReportCreate):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class PublicStatsSummary(BaseModel):
    monitored_vehicles_today: int
    active_surveillance_zones: int
    corridor_interventions_count: int
    incident_resolutions_rate: float
    safety_index_score: float
    masked_recent_activity: List[Dict[str, Any]]
