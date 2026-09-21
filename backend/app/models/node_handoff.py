import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, JSON, Boolean, Integer, ForeignKey
from ..core.database import Base

class VehicleToken(Base):
    """
    Feature 1: Decentralized Single-Address Vehicle Token.
    Assigns a single cryptographic address/token to a vehicle upon first detection.
    Stores its live kinematic state (velocity, heading, trajectory vector) to share with downstream cameras.
    """
    __tablename__ = "vehicle_tokens"

    token_id = Column(String(64), primary_key=True, index=True) # e.g. "tok_fck_a9f1..."
    plate_number = Column(String(20), index=True, nullable=False)
    vehicle_type = Column(String(50), default="car")
    color = Column(String(50), default="Unknown")
    
    # Kinematic & Spatial State
    current_camera_id = Column(String(50), nullable=False)
    current_lat = Column(Float, nullable=False)
    current_lng = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=0.0)
    heading_deg = Column(Float, default=0.0) # Angle of movement vector
    trajectory_vector = Column(JSON, nullable=True) # [{"lat":..., "lng":..., "t":...}]
    dna_embedding = Column(JSON, nullable=True) # 8D feature embedding
    
    # Active nodes watching this token
    predicted_next_nodes = Column(JSON, default=list) # ["cam-02", "cam-03"]
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NodeHandoffPacket(Base):
    """
    Edge-to-Edge Predictive Node Forwarding Protocol.
    Transmits lightweight compressed state packets from source camera to downstream neighbor cameras.
    """
    __tablename__ = "node_handoff_packets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token_id = Column(String(64), ForeignKey("vehicle_tokens.token_id", ondelete="CASCADE"), index=True, nullable=False)
    source_camera_id = Column(String(50), index=True, nullable=False)
    target_camera_id = Column(String(50), index=True, nullable=False)
    
    estimated_arrival_time = Column(DateTime, nullable=False)
    transit_confidence = Column(Float, default=0.90)
    payload_size_bytes = Column(Integer, default=128) # Highly compressed handoff packet
    acknowledged = Column(Boolean, default=False)
    received_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
