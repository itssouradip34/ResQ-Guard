from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from ..core.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String, primary_key=True, index=True)
    plate_number = Column(String, unique=True, index=True, nullable=False)
    plate_hash = Column(String, index=True, nullable=False)
    vehicle_type = Column(String, default="car") # car, suv, truck, bus, motorbike, ambulance
    color = Column(String, default="Unknown")
    is_blacklisted = Column(Boolean, default=False)
    blacklist_reason = Column(String, nullable=True)
    needs_review = Column(Boolean, default=False)
    dna_embedding = Column(JSON, nullable=True) # visual vector / color histogram
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
