from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class VehicleBase(BaseModel):
    plate_number: str
    vehicle_type: str = "car"
    color: str = "Unknown"

class VehicleOut(VehicleBase):
    id: str
    plate_hash: str
    is_blacklisted: bool
    blacklist_reason: Optional[str] = None
    needs_review: bool
    dna_embedding: Optional[List[float]] = None
    first_seen: datetime
    last_seen: datetime

    class Config:
        from_attributes = True

class BlacklistToggle(BaseModel):
    is_blacklisted: bool
    reason: Optional[str] = None

class VehicleDNASimilarQuery(BaseModel):
    vehicle_id: str
    top_n: int = 5

class VehicleDNASimilarResult(BaseModel):
    vehicle: VehicleOut
    similarity_score: float
    reason: str
