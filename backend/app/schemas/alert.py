from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AlertOut(BaseModel):
    id: str
    alert_type: str
    vehicle_id: Optional[str] = None
    plate_text: Optional[str] = None
    camera_id: Optional[str] = None
    camera_name: Optional[str] = None
    severity: str
    message: str
    acknowledged: bool
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class AlertExplanationOut(BaseModel):
    alert_id: str
    summary: str
    rules_triggered: List[Dict[str, Any]]
    contributing_factors: Optional[Dict[str, Any]] = None
    evidence_urls: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: str = "Officer On Duty"
