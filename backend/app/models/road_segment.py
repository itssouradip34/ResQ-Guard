from sqlalchemy import Column, String, Float, JSON
from ..core.database import Base

class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    zone = Column(String, nullable=False, default="Central Zone")
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lng = Column(Float, nullable=False)
    speed_limit_kmh = Column(Float, default=50.0)
    normal_direction_deg = Column(Float, default=90.0)
    restricted_for = Column(JSON, nullable=True) # ["truck", "heavy_vehicle"]
