from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class CameraBase(BaseModel):
    id: str
    name: str
    video_path: Optional[str] = None
    rtsp_url: Optional[str] = None
    latitude: float
    longitude: float
    zone: str = "Central Zone"
    road_segment: Optional[str] = None
    video_url: Optional[str] = None
    status: str = "online"
    fps: float = 25.0

class CameraCreate(CameraBase):
    pass

class CameraOut(CameraBase):
    last_heartbeat: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class CameraHeartbeat(BaseModel):
    camera_id: str
    fps: float
    status: str = "online"

class CameraHealthOut(BaseModel):
    camera_id: str
    camera_name: str
    current_status: str
    current_fps: float
    uptime_percentage: float
    recent_fps_history: List[dict]
