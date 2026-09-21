import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, JSON, Boolean, Integer, Text, ForeignKey
from ..core.database import Base

class AccidentIncident(Base):
    """
    Feature 2: Multi-Modal Accident & Crash Prediction and Detection.
    Stores spatial overlaps, abnormal lateral lane deviations, acoustic crash signatures, and shockwaves.
    """
    __tablename__ = "accident_incidents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    camera_id = Column(String(50), index=True, nullable=False)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    road_segment_name = Column(String(100), default="Corridor Alpha")
    
    # Detection Type:
    # 'SPATIAL_COLLISION_OVERLAP', 'ABRUPT_LANE_DEVIATION', 'ACOUSTIC_CRASH_SIGNATURE', 'TRAFFIC_SHOCKWAVE_DECEL'
    trigger_type = Column(String(50), nullable=False)
    severity = Column(String(20), default="CRITICAL") # LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, default=0.95)
    
    # Involved entities
    primary_vehicle_plate = Column(String(20), nullable=True)
    secondary_vehicle_plate = Column(String(20), nullable=True)
    
    # Quantitative Kinematic / Acoustic Metrics
    lateral_accel_ms2 = Column(Float, nullable=True) # e.g. 6.8 m/s^2 (severe swerve)
    speed_drop_kmh = Column(Float, nullable=True) # e.g. -48.0 km/h deceleration
    acoustic_signature = Column(String(50), nullable=True) # "tire_skid", "metal_crush", "glass_break", "crowd_scream"
    acoustic_db_level = Column(Float, nullable=True) # e.g. 104.5 dB
    
    evidence_snapshot_url = Column(String(500), nullable=True)
    telemetry_data = Column(JSON, default=dict) # Trajectory overlap points, spectrogram features
    
    # Automated SOS Link
    sos_activated = Column(Boolean, default=False)
    sos_dispatch_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class SOSDispatch(Base):
    """
    Automated ResQRoute SOS Emergency Dispatch.
    Dispatches nearest hospital, ambulance unit, and PCR patrol with active green corridor.
    """
    __tablename__ = "sos_dispatches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), nullable=False, index=True)
    incident_type = Column(String(50), default="ACCIDENT_COLLISION")
    
    # Emergency units assigned
    nearest_hospital_name = Column(String(100), nullable=False)
    nearest_hospital_dist_km = Column(Float, nullable=False)
    dispatched_ambulance_id = Column(String(50), nullable=False)
    dispatched_pcr_van_id = Column(String(50), nullable=False)
    
    # Corridor Metrics
    green_corridor_id = Column(String(50), nullable=True)
    estimated_arrival_minutes = Column(Float, default=4.5)
    corridor_waypoints = Column(JSON, default=list) # Lat/Lng polyline
    cleared_signal_count = Column(Integer, default=5)
    
    status = Column(String(30), default="DISPATCHED") # DISPATCHED, EN_ROUTE, ON_SCENE, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow)
