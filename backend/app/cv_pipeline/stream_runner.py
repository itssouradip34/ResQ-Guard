"""
Real replacement for backend/app/cv_pipeline/stream_runner.py.

What changed vs. the original:
  - No more random.random() < 0.7 fake-event generator.
  - Opens a real cv2.VideoCapture per camera using Camera.video_path
    (loops the file when it ends -- fine for demo/test footage).
  - Runs detector_tracker.process_frame() on real frames instead of
    detector_tracker.process_frame(camera_id) with no image.
  - Crops each plate_crop_bbox from the real frame and runs it through
    BOTH ocr_engine (EasyOCR) and paddle_engine (PaddleOCR), then fuses
    the two via plate_ocr.py's fuse_ocr_scores() -- genuine dual-engine
    fusion instead of the single-engine run_single_engine() path.
  - Cameras with no video_path/rtsp_url set are skipped for detection (their
    heartbeat/FPS telemetry still updates) rather than falling back to the
    old mock -- see NOTE below on why.

NOTE on cameras with no video source: the original mock ran even for
cameras with nothing behind them, since it invented everything anyway. Real
detection can't run without real frames, so until every camera row has a
video_path or rtsp_url, those cameras just won't produce sightings. That's
correct behavior, not a bug -- fill in video_path in your seed-cameras.json
(or DB rows) to bring a camera "live."

Threading note: cv2 frame reads + YOLO inference + two OCR engines are all
blocking/CPU-bound. Running them directly in the asyncio loop would stall
the WebSocket broadcasts. Each camera's per-tick work is offloaded via
asyncio.to_thread.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Optional

import cv2

from ..core.database import SessionLocal
from ..models.camera import Camera
from ..models.camera_health import CameraHealthLog
from ..core.event_bus import event_bus
from .detector import detector_tracker
from .ocr_engine import ocr_engine
from .paddle_engine import paddle_engine
from .plate_ocr import fuse_ocr_scores

logger = logging.getLogger("stream_runner")


class StreamRunner:
    def __init__(self):
        self.is_running = False
        self._task = None
        # One persistent VideoCapture per camera_id, opened lazily and kept
        # open across ticks -- reopening a video file every 5s is wasteful
        # and loses playback position.
        self._captures: Dict[str, cv2.VideoCapture] = {}

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
        for cap in self._captures.values():
            cap.release()
        self._captures.clear()
        logger.info("Camera Stream Runner stopped.")

    def _get_capture(self, camera: Camera) -> Optional[cv2.VideoCapture]:
        """Returns an open VideoCapture for this camera, or None if the
        camera has no video source configured or the source can't be opened."""
        source = camera.rtsp_url or camera.video_path
        if not source:
            return None

        cap = self._captures.get(camera.id)
        if cap is not None and cap.isOpened():
            return cap

        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            logger.warning(f"Camera {camera.id}: could not open source '{source}'")
            return None

        self._captures[camera.id] = cap
        return cap

    def _read_frame(self, camera: Camera):
        """Blocking frame read + loop-on-EOF. Runs inside asyncio.to_thread."""
        cap = self._get_capture(camera)
        if cap is None:
            return None

        ret, frame = cap.read()
        if not ret:
            # Likely end of a finite video file -- loop back to the start
            # rather than treating it as a dead camera.
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
            if not ret:
                logger.warning(f"Camera {camera.id}: source exhausted, could not loop")
                return None

        return frame

    def _process_camera_frame_sync(self, camera: Camera):
        """
        Blocking work for one camera's tick: read a frame, run detection,
        run BOTH OCR engines on each plate crop, fuse the results. Returns
        a list of event_payload dicts ready for IngestionService, or [] if
        nothing to report this tick. Runs inside asyncio.to_thread -- do not
        call directly from the asyncio loop.
        """
        frame = self._read_frame(camera)
        if frame is None:
            return []

        detections = detector_tracker.process_frame(camera_id=camera.id, frame=frame)

        events = []
        h, w = frame.shape[:2]
        for det in detections:
            x1, y1, x2, y2 = [int(v) for v in det["plate_crop_bbox"]]
            # Clip to frame bounds -- detector boxes can land at the edge.
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            if x2 <= x1 or y2 <= y1:
                continue

            plate_crop = frame[y1:y2, x1:x2]

            # Run both engines independently on the same crop, then fuse.
            easy_text, easy_conf = ocr_engine.read_plate(plate_crop)
            paddle_text, paddle_conf = paddle_engine.read_plate(plate_crop)
            ocr_result = fuse_ocr_scores(paddle_text, paddle_conf, easy_text, easy_conf)

            # Skip low-confidence garbage rather than logging every empty read
            if not ocr_result["final_plate"]:
                continue

            events.append({
                "camera_id": camera.id,
                "plate_text": ocr_result["final_plate"],
                "confidence": det["confidence"],
                "fused_confidence": ocr_result["fused_confidence"],
                "plate_format_valid": ocr_result["plate_format_valid"],
                "needs_review": ocr_result["needs_review"],
                "bbox": det["bbox"],
                "vehicle_type": det["vehicle_type"],
                "color": det["color"],
                "speed_estimate": det["speed_estimate"],  # still None -- needs cross-frame tracking, not covered here
                "ocr_engine_scores": ocr_result["ocr_engine_scores"],
                "snapshot": None,  # was a fake path before; wire up real snapshot saving separately if you want evidence images persisted
            })

        return events

    async def _run_loop(self):
        from ..services.ingestion_service import IngestionService

        while self.is_running:
            try:
                db = SessionLocal()
                try:
                    cameras = db.query(Camera).filter(Camera.status != "offline").all()

                    for cam in cameras:
                        # Heartbeat/FPS telemetry still updates for every
                        # camera, same as before -- this part wasn't fake.
                        cam.last_heartbeat = datetime.utcnow()
                        log = CameraHealthLog(
                            camera_id=cam.id,
                            fps=cam.fps,
                            status=cam.status,
                            checked_at=datetime.utcnow(),
                        )
                        db.add(log)

                        await event_bus.broadcast_camera_status({
                            "camera_id": cam.id,
                            "camera_name": cam.name,
                            "fps": cam.fps,
                            "status": cam.status,
                            "timestamp": datetime.utcnow().isoformat(),
                        })

                    db.commit()

                    # Real detection pass -- one camera per tick to keep CPU
                    # load bounded; round-robin via a simple offset so every
                    # camera eventually gets processed rather than only the
                    # first one in the list.
                    if cameras:
                        self._tick_index = getattr(self, "_tick_index", 0)
                        target_cam = cameras[self._tick_index % len(cameras)]
                        self._tick_index += 1

                        events = await asyncio.to_thread(
                            self._process_camera_frame_sync, target_cam
                        )
                        for event_payload in events:
                            await IngestionService.process_ingestion_event(db, event_payload)

                finally:
                    db.close()

                await asyncio.sleep(5)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in stream runner loop: {e}", exc_info=True)
                await asyncio.sleep(5)


stream_runner = StreamRunner()