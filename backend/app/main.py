from contextlib import asynccontextmanager
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import settings
from .core.database import engine, Base, SessionLocal
from .core.event_bus import event_bus
from .services.seed_service import SeedService
from .cv_pipeline.stream_runner import stream_runner

# Import all models to ensure metadata registration
from .models import *

# Import all API routers
from .api.v1.cameras import router as cameras_router
from .api.v1.ingestion import router as ingestion_router
from .api.v1.vehicles import router as vehicles_router
from .api.v1.trajectories import router as trajectories_router
from .api.v1.analytics import router as analytics_router
from .api.v1.alerts import router as alerts_router
from .api.v1.incidents import router as incidents_router
from .api.v1.vehicle_dna import router as vehicle_dna_router
from .api.v1.predictive import router as predictive_router
from .api.v1.assistant import router as assistant_router
from .api.v1.search import router as search_router
from .api.v1.resqroute import router as resqroute_router
from .api.v1.digital_twin import router as digital_twin_router
from .api.v1.citizen import router as citizen_router
from .api.v1.governance import router as governance_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        SeedService.seed_initial_data(db)
    finally:
        db.close()

    # Start camera stream runner daemon
    await stream_runner.start()
    yield
    # Shutdown
    await stream_runner.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Enterprise City-Wide AI ANPR, Multi-Camera Trajectory Tracking, Explainable Alerts, and ResQRoute 2.0 Emergency Corridor Platform.",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for snapshots / evidence images
snapshots_dir = os.path.join(os.path.dirname(__file__), "..", "sample_data", "snapshots")
os.makedirs(snapshots_dir, exist_ok=True)
app.mount("/static/snapshots", StaticFiles(directory=snapshots_dir), name="snapshots")

# Include Routers under /api/v1
api_v1_prefix = settings.API_V1_STR
app.include_router(cameras_router, prefix=api_v1_prefix)
app.include_router(ingestion_router, prefix=api_v1_prefix)
app.include_router(vehicles_router, prefix=api_v1_prefix)
app.include_router(trajectories_router, prefix=api_v1_prefix)
app.include_router(analytics_router, prefix=api_v1_prefix)
app.include_router(alerts_router, prefix=api_v1_prefix)
app.include_router(incidents_router, prefix=api_v1_prefix)
app.include_router(vehicle_dna_router, prefix=api_v1_prefix)
app.include_router(predictive_router, prefix=api_v1_prefix)
app.include_router(assistant_router, prefix=api_v1_prefix)
app.include_router(search_router, prefix=api_v1_prefix)
app.include_router(resqroute_router, prefix=api_v1_prefix)
app.include_router(digital_twin_router, prefix=api_v1_prefix)
app.include_router(governance_router, prefix=api_v1_prefix)
app.include_router(citizen_router, prefix=api_v1_prefix) # includes /report and /public/stats

# WebSockets
@app.websocket("/ws/live-feed")
async def websocket_live_feed(websocket: WebSocket):
    """FR-07.2: Real-time vehicle detection event stream for live GIS map pins (< 2s)."""
    await event_bus.connect_live_feed(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        event_bus.disconnect_live_feed(websocket)

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """FR-09.4: Real-time alert stream for hotlist and anomalous route alerts."""
    await event_bus.connect_alerts(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        event_bus.disconnect_alerts(websocket)

@app.websocket("/ws/cameras")
async def websocket_cameras(websocket: WebSocket):
    """FR-10.1: Live camera heartbeat and FPS telemetry stream."""
    await event_bus.connect_cameras(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        event_bus.disconnect_cameras(websocket)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "mode": "offline_enabled",
        "version": "1.0.0"
    }
