from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, JSON, ForeignKey
from ..core.database import Base

class Trajectory(Base):
    __tablename__ = "trajectories"

    id = Column(String, primary_key=True, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), index=True, nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, default=datetime.utcnow)
    path_geojson = Column(JSON, nullable=False) # GeoJSON Feature or LineString/MultiPoint
    camera_sequence = Column(JSON, nullable=False) # list of camera_ids and timestamps
    total_distance_km = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow)
