from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.camera import Camera
from ..models.camera_health import CameraHealthLog
from ..schemas.camera import CameraCreate, CameraHealthOut
from ..core.config import settings

class CameraService:
    @staticmethod
    def get_all_cameras(db: Session) -> List[Camera]:
        cameras = db.query(Camera).all()
        now = datetime.utcnow()
        timeout_threshold = now - timedelta(seconds=settings.CAMERA_HEARTBEAT_TIMEOUT_SEC)
        
        # Automatically mark cameras offline if no heartbeat > 30s
        for cam in cameras:
            if cam.last_heartbeat and cam.last_heartbeat < timeout_threshold and cam.status != "offline":
                cam.status = "offline"
                db.add(cam)
        db.commit()
        return cameras

    @staticmethod
    def get_camera_by_id(db: Session, camera_id: str) -> Optional[Camera]:
        return db.query(Camera).filter(Camera.id == camera_id).first()

    @staticmethod
    def create_camera(db: Session, camera_in: CameraCreate) -> Camera:
        cam = Camera(
            id=camera_in.id,
            name=camera_in.name,
            video_path=camera_in.video_path,
            rtsp_url=camera_in.rtsp_url,
            latitude=camera_in.latitude,
            longitude=camera_in.longitude,
            zone=camera_in.zone,
            road_segment=camera_in.road_segment,
            status=camera_in.status,
            fps=camera_in.fps,
            last_heartbeat=datetime.utcnow()
        )
        db.add(cam)
        db.commit()
        db.refresh(cam)
        return cam

    @staticmethod
    def update_heartbeat(db: Session, camera_id: str, fps: float, status: str = "online") -> Optional[Camera]:
        cam = db.query(Camera).filter(Camera.id == camera_id).first()
        if cam:
            cam.last_heartbeat = datetime.utcnow()
            cam.fps = fps
            cam.status = status
            
            # Record in health log
            log = CameraHealthLog(
                camera_id=camera_id,
                fps=fps,
                status=status,
                checked_at=datetime.utcnow()
            )
            db.add(log)
            db.commit()
            db.refresh(cam)
        return cam

    @staticmethod
    def get_camera_health(db: Session, camera_id: str) -> Optional[CameraHealthOut]:
        cam = db.query(Camera).filter(Camera.id == camera_id).first()
        if not cam:
            return None

        # Fetch recent health logs
        logs = db.query(CameraHealthLog).filter(
            CameraHealthLog.camera_id == camera_id
        ).order_by(CameraHealthLog.checked_at.desc()).limit(20).all()

        total_logs = len(logs)
        online_logs = sum(1 for log in logs if log.status == "online")
        uptime_pct = round((online_logs / max(1, total_logs)) * 100.0, 1)

        history = [
            {"time": log.checked_at.strftime("%H:%M:%S"), "fps": log.fps, "status": log.status}
            for log in reversed(logs)
        ]

        return CameraHealthOut(
            camera_id=cam.id,
            camera_name=cam.name,
            current_status=cam.status,
            current_fps=cam.fps,
            uptime_percentage=uptime_pct if total_logs > 0 else 100.0,
            recent_fps_history=history
        )
