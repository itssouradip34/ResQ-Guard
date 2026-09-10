from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from ..core.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=True)
    vehicle_plate = Column(String, nullable=True)
    camera_id = Column(String, ForeignKey("cameras.id"), index=True, nullable=False)
    incident_type = Column(String, nullable=False, index=True) # stopped_too_long, wrong_direction, sudden_deceleration
    confidence = Column(Float, default=0.90)
    severity = Column(String, default="medium")
    status = Column(String, default="open", index=True)  # open, resolved
    details = Column(String, nullable=True)
    evidence_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)