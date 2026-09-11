from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer
from ..core.database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    video_path = Column(String, nullable=True)
    rtsp_url = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    zone = Column(String, nullable=False, default="Central Zone")
    road_segment = Column(String, nullable=True)
    status = Column(String, default="online")  # online, degraded, offline
    fps = Column(Float, default=25.0)
    last_heartbeat = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def video_url(self):
        if self.video_path:
            import os
            return f"/static/videos/{os.path.basename(self.video_path)}"
        return None
