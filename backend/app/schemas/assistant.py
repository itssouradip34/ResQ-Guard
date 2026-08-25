from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AssistantQueryRequest(BaseModel):
    query: str

class AssistantQueryResponse(BaseModel):
    query: str
    answer: str
    generated_sql: Optional[str] = None
    chart_type: Optional[str] = None # bar, line, pie, metric
    chart_data: Optional[Any] = None
    confidence: float = 0.95
    sources: List[str] = []

class VehicleSearchDescribeRequest(BaseModel):
    description: str # e.g. "white SUV near Connaught Place around 2pm"
    color: Optional[str] = None
    vehicle_type: Optional[str] = None
    camera_id: Optional[str] = None
    zone: Optional[str] = None
    reference_embedding: Optional[List[float]] = None

class VehicleSearchCandidate(BaseModel):
    vehicle_id: str
    plate_number: str
    vehicle_type: str
    color: str
    last_camera: str
    last_seen: str
    match_score: float
    reasons: List[str]
    snapshot_url: Optional[str] = None
