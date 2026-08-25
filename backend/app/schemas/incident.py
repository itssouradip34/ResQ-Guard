from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class IncidentOut(BaseModel):
    id: str
    vehicle_id: Optional[str] = None
    vehicle_plate: Optional[str] = None
    camera_id: str
    camera_name: Optional[str] = None
    incident_type: str
    confidence: float
    severity: str
    details: Optional[str] = None
    evidence_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
