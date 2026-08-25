from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, JSON
from ..core.database import Base

class AssistantQueryLog(Base):
    __tablename__ = "assistant_query_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    query_text = Column(String, nullable=False)
    generated_sql = Column(String, nullable=True)
    response_text = Column(String, nullable=False)
    chart_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
