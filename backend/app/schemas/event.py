from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class IngestionEventCreate(BaseModel):
    camera_id: str
    plate_text: str
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    bbox: Optional[List[float]] = None # [x1, y1, x2, y2]
    vehicle_type: str = "car"
    color: str = "Unknown"
    speed_estimate: Optional[float] = 45.0
    direction_vector: Optional[Any] = None
    timestamp: Optional[datetime] = None
    snapshot: Optional[str] = None # Base64 or URL
    ocr_engine_scores: Optional[Dict[str, Any]] = None

class VehicleEventOut(BaseModel):
    id: str
    vehicle_id: str
    camera_id: str
    plate_text: str
    confidence: float
    fused_confidence: float
    plate_format_valid: bool
    needs_review: bool
    bbox: Optional[List[float]] = None
    vehicle_type: str
    color: str
    speed_estimate: float
    direction_vector: Optional[Any] = None
    ocr_engine_scores: Optional[Dict[str, Any]] = None
    snapshot_url: Optional[str] = None
    latitude: float
    longitude: float
    timestamp: datetime

    class Config:
        from_attributes = True
