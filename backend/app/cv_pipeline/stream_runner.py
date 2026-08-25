import asyncio
import logging
from datetime import datetime
import random
from typing import Dict, Any, List
from ..core.database import SessionLocal
from ..models.camera import Camera
from ..models.camera_health import CameraHealthLog
from ..core.event_bus import event_bus
from .detector import detector_tracker
from .plate_ocr import fuse_ocr_scores
from .dna_extractor import extract_vehicle_dna_from_crop

logger = logging.getLogger("stream_runner")

class StreamRunner:
    def __init__(self):
        self.is_running = False
        self._task = None

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info("Camera Stream Runner started.")

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
        logger.info("Camera Stream Runner stopped.")

    async def _run_loop(self):
        from ..services.ingestion_service import IngestionService
        
        while self.is_running:
            try:
                db = SessionLocal()
                try:
                    cameras = db.query(Camera).filter(Camera.status != "offline").all()
                    
                    for cam in cameras:
                        # Update camera heartbeat
                        cam.last_heartbeat = datetime.utcnow()
                        current_fps = round(cam.fps + random.uniform(-0.5, 0.5), 1)
                        cam.fps = current_fps
                        
                        # Log health
                        log = CameraHealthLog(
                            camera_id=cam.id,
                            fps=current_fps,
                            status=cam.status,
                            checked_at=datetime.utcnow()
                        )
                        db.add(log)
                        
                        # Broadcast camera status
                        await event_bus.broadcast_camera_status({
                            "camera_id": cam.id,
                            "camera_name": cam.name,
                            "fps": current_fps,
                            "status": cam.status,
                            "timestamp": datetime.utcnow().isoformat()
                        })

                    db.commit()

                    # Occasionally generate automated camera sighting event for live demo
                    if cameras and random.random() < 0.7:
                        target_cam = random.choice(cameras)
                        detections = detector_tracker.process_frame(target_cam.id)
                        
                        for det in detections:
                            plate_text = det["plate_candidate"]
                            # Run dual engine fusion
                            paddle_conf = det["confidence"]
                            easy_conf = max(0.70, paddle_conf - random.uniform(0.01, 0.04))
                            fusion = fuse_ocr_scores(
                                paddle_text=plate_text,
                                paddle_conf=paddle_conf,
                                easy_text=plate_text,
                                easy_conf=easy_conf
                            )
                            
                            # Ingest event
                            event_payload = {
                                "camera_id": target_cam.id,
                                "plate_text": fusion["final_plate"],
                                "confidence": paddle_conf,
                                "fused_confidence": fusion["fused_confidence"],
                                "plate_format_valid": fusion["plate_format_valid"],
                                "needs_review": fusion["needs_review"],
                                "bbox": det["bbox"],
                                "vehicle_type": det["vehicle_type"],
                                "color": det["color"],
                                "speed_estimate": det["speed_estimate"],
                                "ocr_engine_scores": fusion["ocr_engine_scores"],
                                "snapshot": f"/static/snapshots/{target_cam.id}_{plate_text}.jpg"
                            }
                            await IngestionService.process_ingestion_event(db, event_payload)

                finally:
                    db.close()

                # Sleep 4-6 seconds between automatic frame passes
                await asyncio.sleep(5)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in stream runner loop: {e}", exc_info=True)
                await asyncio.sleep(5)

stream_runner = StreamRunner()
