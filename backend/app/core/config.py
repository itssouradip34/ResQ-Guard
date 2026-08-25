from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "ResQ-Guard: City-Wide AI ANPR & Vehicle Intelligence"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./resq_guard.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CORS_ORIGINS: List[str] = ["*"]
    
    # Camera / ANPR Pipeline Config
    CAMERA_HEARTBEAT_TIMEOUT_SEC: int = 30
    DEFAULT_TRAJECTORY_WINDOW_HOURS: int = 4
    OCR_SIMILARITY_THRESHOLD: float = 0.90
    IMPOSSIBLE_TRAVEL_SPEED_KMH: float = 160.0
    
    # Simulation / Offline Mode
    OFFLINE_MODE: bool = True
    MOCK_CAMERA_STREAMS: bool = True
    
    class Config:
        case_sensitive = True

settings = Settings()
