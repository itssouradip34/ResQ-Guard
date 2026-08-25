from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from ..core.database import Base

class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plate_text = Column(String, nullable=True)
    vehicle_type = Column(String, nullable=True)
    color = Column(String, nullable=True)
    location_description = Column(String, nullable=False)
    description = Column(String, nullable=False)
    photo_url = Column(String, nullable=True)
    status = Column(String, default="submitted") # submitted, under_review, resolved
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
