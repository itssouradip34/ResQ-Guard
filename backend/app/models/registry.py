from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from ..core.database import Base

class MockVehicleRegistry(Base):
    __tablename__ = "mock_vehicle_registry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plate_number = Column(String, unique=True, index=True, nullable=False)
    registered_type = Column(String, nullable=False)
    registered_color = Column(String, nullable=False)
    owner_name = Column(String, nullable=True)
    registration_date = Column(String, nullable=True)
    status = Column(String, default="active")

class PlateIntegrityFlag(Base):
    __tablename__ = "plate_integrity_flags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, ForeignKey("vehicle_events.id"), index=True, nullable=True)
    plate_number = Column(String, index=True, nullable=False)
    flag_type = Column(String, nullable=False) # plate_vehicle_type_mismatch, duplicate_plate_multi_location, plate_visual_mismatch
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
