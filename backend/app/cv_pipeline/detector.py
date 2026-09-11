"""
Real vehicle/plate detector + tracker for ResQ-Guard's cv_pipeline.

Replaces backend/app/cv_pipeline/detector.py's random.sample() mock with
actual YOLO inference. Uses Ultralytics' built-in track() (ByteTrack under
the hood) so you get persistent track IDs for free.

WHAT THIS COVERS:
  - Plate detection using your fine-tuned YOLOv26n `best.pt` (single class:
    "License_Plate") -> gives you plate_crop_bbox directly.

WHAT THIS DOES *NOT* COVER (be aware before you drop this in):
  - Vehicle type/color classification. Your best.pt only knows plates, not
    vehicle classes. To get vehicle_type ("car"/"suv"/"truck"/...) and color
    the way the existing schema expects, you need either:
      (a) a second detector trained on a vehicle-class dataset (COCO's
          pretrained classes -- car/truck/bus/motorcycle -- would get you
          most of the way with a stock yolo26n.pt, no fine-tuning needed), or
      (b) drop vehicle_type/color from the schema for now and backfill later.
    Below, VEHICLE_MODEL_PATH is optional -- if you don't set it, vehicle_type
    falls back to "unknown" and color falls back to "unknown" rather than
    inventing a value.

Config: set these three via env vars or edit the constants below.
"""

import os
import time
from typing import List, Dict, Any, Optional

import numpy as np
from ultralytics import YOLO

# --- Config -----------------------------------------------------------
# Path to your fine-tuned plate detector (best.pt from plate_yolo26/train-3)
DEFAULT_PLATE_MODEL = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "best.pt")
if not os.path.exists(DEFAULT_PLATE_MODEL):
    DEFAULT_PLATE_MODEL = "models/best.pt"
PLATE_MODEL_PATH = os.getenv("PLATE_MODEL_PATH", DEFAULT_PLATE_MODEL)

# Optional: path to a vehicle-class detector (e.g. stock yolo26n.pt, which
# ships pretrained on COCO and already knows car/truck/bus/motorcycle).
# Leave unset to skip vehicle classification.
VEHICLE_MODEL_PATH = os.getenv("VEHICLE_MODEL_PATH", "")

PLATE_CONF_THRESHOLD = float(os.getenv("PLATE_CONF_THRESHOLD", "0.35"))
VEHICLE_CONF_THRESHOLD = float(os.getenv("VEHICLE_CONF_THRESHOLD", "0.35"))

# COCO class ids Ultralytics uses for vehicle-ish classes, mapped to the
# vehicle_type strings the rest of the app expects.
COCO_VEHICLE_CLASS_MAP = {
    2: "car",
    3: "motorbike",
    5: "bus",
    7: "truck",
}


class VehicleTrack:
    def __init__(self, track_id: int, bbox: List[float], vehicle_type: str, color: str):
        self.track_id = track_id
        self.bbox = bbox  # [x1, y1, x2, y2]
        self.vehicle_type = vehicle_type
        self.color = color
        self.first_frame_time = time.time()
        self.last_update_time = time.time()
        self.hits = 1


class VehicleDetectorTracker:
    """
    Real detector/tracker. Call process_frame(camera_id, frame) with an
    actual BGR numpy image (e.g. from cv2.VideoCapture.read()) each time
    you have a new frame -- NOT on a timer with no image, like the mock did.
    """

    def __init__(self):
        self.active_tracks: Dict[int, VehicleTrack] = {}

        self.plate_model = YOLO(PLATE_MODEL_PATH)

        self.vehicle_model: Optional[YOLO] = None
        if VEHICLE_MODEL_PATH:
            self.vehicle_model = YOLO(VEHICLE_MODEL_PATH)

    def process_frame(
        self,
        camera_id: str,
        frame: np.ndarray,
    ) -> List[Dict[str, Any]]:
        """
        Runs real detection + tracking on a single frame.

        Args:
            camera_id: identifier of the source camera (for logging only here;
                       persistence/track continuity across cameras is handled
                       by whatever calls this per-camera).
            frame: BGR numpy array (H, W, 3), e.g. from cv2.VideoCapture.

        Returns: list of detections in the same shape the rest of the app
                 expects (track_id, vehicle_type, color, plate_crop_bbox,
                 bbox, confidence, speed_estimate). Note: this function does
                 NOT run OCR -- pass plate_crop_bbox crops to the OCR engine
                 separately (see ocr_engine.py).
        """
        if frame is None or frame.size == 0:
            return []

        results: List[Dict[str, Any]] = []

        # --- Vehicle detection + tracking (if a vehicle model is configured) ---
        vehicle_boxes = []
        if self.vehicle_model is not None:
            track_results = self.vehicle_model.track(
                frame,
                persist=True,
                conf=VEHICLE_CONF_THRESHOLD,
                classes=list(COCO_VEHICLE_CLASS_MAP.keys()),
                verbose=False,
            )
            if track_results and track_results[0].boxes is not None:
                boxes = track_results[0].boxes
                for i in range(len(boxes)):
                    xyxy = boxes.xyxy[i].tolist()
                    cls_id = int(boxes.cls[i].item())
                    conf = float(boxes.conf[i].item())
                    track_id = int(boxes.id[i].item()) if boxes.id is not None else None
                    vehicle_boxes.append({
                        "bbox": xyxy,
                        "vehicle_type": COCO_VEHICLE_CLASS_MAP.get(cls_id, "unknown"),
                        "confidence": conf,
                        "track_id": track_id,
                    })

        # --- Plate detection (always runs -- this is your fine-tuned model) ---
        plate_results = self.plate_model.predict(
            frame, conf=PLATE_CONF_THRESHOLD, verbose=False
        )
        plate_boxes = []
        if plate_results and plate_results[0].boxes is not None:
            boxes = plate_results[0].boxes
            for i in range(len(boxes)):
                xyxy = boxes.xyxy[i].tolist()
                conf = float(boxes.conf[i].item())
                plate_boxes.append({"bbox": xyxy, "confidence": conf})

        # --- Associate each plate with the vehicle box it falls inside (if any) ---
        for plate in plate_boxes:
            px1, py1, px2, py2 = plate["bbox"]
            plate_center = ((px1 + px2) / 2, (py1 + py2) / 2)

            matched_vehicle = None
            for v in vehicle_boxes:
                vx1, vy1, vx2, vy2 = v["bbox"]
                if vx1 <= plate_center[0] <= vx2 and vy1 <= plate_center[1] <= vy2:
                    matched_vehicle = v
                    break

            if matched_vehicle is not None:
                track_id = matched_vehicle["track_id"] or self._assign_fallback_id()
                vehicle_bbox = matched_vehicle["bbox"]
                vehicle_type = matched_vehicle["vehicle_type"]
            else:
                # No vehicle model configured, or no vehicle box matched this
                # plate -- still report the plate detection, just without
                # vehicle-level metadata. Don't invent a vehicle type/color.
                track_id = self._assign_fallback_id()
                vehicle_bbox = plate["bbox"]  # fallback: plate box stands in
                vehicle_type = "unknown"

            results.append({
                "track_id": track_id,
                "vehicle_type": vehicle_type,
                "color": "unknown",  # see module docstring -- needs a color-classification step
                "bbox": vehicle_bbox,
                "plate_crop_bbox": plate["bbox"],
                "confidence": plate["confidence"],
                "speed_estimate": None,  # needs step: speed estimation from track history across frames
            })

        return results

    def _assign_fallback_id(self) -> int:
        # Used when there's no vehicle-tracker track_id to attach to (e.g. no
        # vehicle model configured). Not persistent across frames -- if you
        # need stable IDs without a vehicle model, run the plate model itself
        # through .track() instead of .predict() above.
        self._fallback_counter = getattr(self, "_fallback_counter", 1000) + 1
        return self._fallback_counter


detector_tracker = VehicleDetectorTracker()
