from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from ..core.database import Base

class CameraHealthLog(Base):
    __tablename__ = "camera_health_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(String, ForeignKey("cameras.id"), index=True, nullable=False)
    fps = Column(Float, default=25.0)
    status = Column(String, default="online")
    checked_at = Column(DateTime, default=datetime.utcnow, index=True)
