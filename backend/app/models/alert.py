from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON, ForeignKey
from ..core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    alert_type = Column(String, nullable=False, index=True) # blacklist_hit, suspicious_route, fake_plate_suspected
    vehicle_id = Column(String, ForeignKey("vehicles.id"), index=True, nullable=True)
    plate_text = Column(String, nullable=True)
    camera_id = Column(String, ForeignKey("cameras.id"), index=True, nullable=True)
    severity = Column(String, default="high") # critical, high, medium, low
    message = Column(String, nullable=False)
    
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class AlertExplanation(Base):
    __tablename__ = "alert_explanations"

    id = Column(String, primary_key=True, index=True)
    alert_id = Column(String, ForeignKey("alerts.id"), index=True, nullable=False)
    summary = Column(String, nullable=False)
    rules_triggered = Column(JSON, nullable=False) # list of rules with weights/evidence
    contributing_factors = Column(JSON, nullable=True)
    evidence_urls = Column(JSON, nullable=True) # image/snapshot URLs
    created_at = Column(DateTime, default=datetime.utcnow)
