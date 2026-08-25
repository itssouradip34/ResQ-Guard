from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...schemas.camera import CameraOut, CameraCreate, CameraHeartbeat, CameraHealthOut
from ...services.camera_service import CameraService
from ...core.security import get_role_context, RoleContext

router = APIRouter(prefix="/cameras", tags=["Cameras"])

@router.get("", response_model=List[CameraOut], summary="List all registered cameras with live status")
def list_cameras(db: Session = Depends(get_db)):
    """FR-01.1 & FR-01.2: Returns all registered cameras with real-time health status."""
    return CameraService.get_all_cameras(db)

@router.post("", response_model=CameraOut, status_code=status.HTTP_201_CREATED, summary="Register a new ANPR camera")
def create_camera(camera_in: CameraCreate, db: Session = Depends(get_db)):
    existing = CameraService.get_camera_by_id(db, camera_in.id)
    if existing:
        raise HTTPException(status_code=400, detail="Camera ID already exists")
    return CameraService.create_camera(db, camera_in)

@router.get("/{camera_id}", response_model=CameraOut, summary="Get camera by ID")
def get_camera(camera_id: str, db: Session = Depends(get_db)):
    cam = CameraService.get_camera_by_id(db, camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam

@router.post("/{camera_id}/heartbeat", response_model=CameraOut, summary="Submit camera heartbeat (FPS & status)")
def heartbeat(camera_id: str, hb: CameraHeartbeat, db: Session = Depends(get_db)):
    cam = CameraService.update_heartbeat(db, camera_id, hb.fps, hb.status)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam

@router.get("/{camera_id}/health", response_model=CameraHealthOut, summary="Get camera health, uptime % and FPS history")
def get_camera_health(camera_id: str, db: Session = Depends(get_db)):
    """FR-10.2: Camera health monitoring with uptime % and recent FPS history."""
    health = CameraService.get_camera_health(db, camera_id)
    if not health:
        raise HTTPException(status_code=404, detail="Camera not found")
    return health
