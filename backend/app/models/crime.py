import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, JSON, Boolean, Integer, Text
from ..core.database import Base

class CrimePoseEvent(Base):
    """
    Feature 4: Heiwa Project Human Skeletal Pose Node Violence & Crime Detection.
    Detects non-regulatory violent human actions via 17-node topological pose graphs.
    """
    __tablename__ = "crime_pose_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    camera_id = Column(String(50), index=True, nullable=False)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    zone_name = Column(String(100), default="Central Sector")

    # Crime Category:
    # 'PHYSICAL_ASSAULT_SLAP', 'WEAPON_KNIFE_DRAW', 'MOLESTATION_STRUGGLE', 'GROUP_BRAWL_FIGHT'
    action_type = Column(String(50), nullable=False)
    confidence = Column(Float, default=0.92)
    severity = Column(String(20), default="CRITICAL") # MEDIUM, HIGH, CRITICAL

    # Skeletal Pose Node Analytics
    person_count = Column(Integer, default=2)
    keypoint_nodes = Column(JSON, nullable=True) # 17 keypoint (x, y, conf) coordinates
    joint_velocity_max = Column(Float, nullable=True) # Max joint angular velocity
    proximity_collapse_ratio = Column(Float, nullable=True) # Inter-person distance compression
    
    # Evidence & Police SOS Dispatch
    evidence_crop_url = Column(String(500), nullable=True)
    explanation = Column(Text, nullable=True)
    
    police_sos_dispatched = Column(Boolean, default=False)
    dispatched_patrol_unit = Column(String(50), nullable=True)
    nearest_police_station = Column(String(100), nullable=True)
    
    status = Column(String(30), default="OPEN") # OPEN, ACKNOWLEDGED, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
