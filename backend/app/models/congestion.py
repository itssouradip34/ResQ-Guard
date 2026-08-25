from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey
from ..core.database import Base

class CongestionForecast(Base):
    __tablename__ = "congestion_forecasts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    road_segment_id = Column(String, ForeignKey("road_segments.id"), index=True, nullable=False)
    predicted_time = Column(DateTime, nullable=False, index=True)
    predicted_level = Column(String, nullable=False) # low, medium, high, severe
    predicted_volume = Column(Integer, default=0)
    model_version = Column(String, default="v1.0-markov-reg")
    created_at = Column(DateTime, default=datetime.utcnow)
