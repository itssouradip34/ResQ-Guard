from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class VehicleEvent(Base):
    __tablename__ = "vehicle_events"

    id = Column(String, primary_key=True, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), index=True, nullable=False)
    camera_id = Column(String, ForeignKey("cameras.id"), index=True, nullable=False)
    plate_text = Column(String, nullable=False)
    confidence = Column(Float, default=0.95)
    fused_confidence = Column(Float, default=0.95)
    plate_format_valid = Column(Boolean, default=True)
    needs_review = Column(Boolean, default=False)
    
    bbox = Column(JSON, nullable=True) # [x1, y1, x2, y2]
    vehicle_type = Column(String, default="car")
    color = Column(String, default="Unknown")
    speed_estimate = Column(Float, default=45.0)
    direction_vector = Column(JSON, nullable=True) # [dx, dy] or angle_deg
    
    ocr_engine_scores = Column(JSON, nullable=True) # {"paddle": 0.94, "easy": 0.92, "char_agreement": 0.96}
    snapshot_url = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
