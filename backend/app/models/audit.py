from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from ..core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor_role = Column(String, nullable=False) # authority, analyst, public
    action = Column(String, nullable=False) # view_raw_plate, blacklist_toggle, search_vehicle, acknowledge_alert
    target_type = Column(String, nullable=False) # vehicle, alert, incident, camera
    target_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
