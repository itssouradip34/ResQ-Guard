"""
Live Computer Vision Frame Processing Endpoint for ResQ-Guard.
Receives real camera/webcam/video frames, executes YOLOv8 + OCR,
and returns genuine real-time bounding boxes and vehicle intelligence.
"""

import base64
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from ...cv_pipeline.detector import detector_tracker
from ...cv_pipeline.ocr_engine import ocr_engine
from ...cv_pipeline.paddle_engine import paddle_engine
from ...cv_pipeline.plate_ocr import fuse_ocr_scores, normalize_plate_text, validate_indian_plate

router = APIRouter(prefix="/cv", tags=["Live Computer Vision Pipeline"])

HOTLIST_PLATES = {"DL01AB1234", "HR26DQ5551", "MH02CD5678", "UP16CD8821", "DL08CX9920"}

class FrameProcessRequest(BaseModel):
    camera_id: str = "cam-01"
    image_base64: str # Base64 encoded JPEG/PNG frame from browser video/webcam

@router.post("/process-frame", summary="Process live video frame with YOLOv8 & Dual-OCR")
def process_live_frame(payload: FrameProcessRequest) -> Dict[str, Any]:
    """
    Decodes real frame from browser/webcam, runs YOLO vehicle & plate detection,
    and returns real bounding boxes. Returns empty list if no vehicles are detected.
    """
    try:
        # Decode base64 frame
        raw_data = payload.image_base64
        if "," in raw_data:
            raw_data = raw_data.split(",", 1)[1]
        img_bytes = base64.b64decode(raw_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if frame is None or frame.size == 0:
            return {"detections": [], "count": 0}

        h, w = frame.shape[:2]

        # Run real YOLO detector & tracker
        tracked_results = detector_tracker.process_frame(payload.camera_id, frame)
        
        detections = []
        for det in tracked_results:
            bbox = det.get("bbox", [0, 0, 0, 0])
            x1, y1, x2, y2 = bbox
            
            # Normalize to percentages (0 - 100%) for web UI rendering
            top_pct = max(0.0, min(100.0, (y1 / h) * 100.0))
            left_pct = max(0.0, min(100.0, (x1 / w) * 100.0))
            width_pct = max(1.0, min(100.0, ((x2 - x1) / w) * 100.0))
            height_pct = max(1.0, min(100.0, ((y2 - y1) / h) * 100.0))

            v_type = det.get("vehicle_type", "car")
            color = det.get("color", "White")
            speed = det.get("speed_estimate", 45.0)

            # OCR on Plate Crop if available
            plate_text = det.get("plate_number", "")
            conf = det.get("confidence", 0.90)
            
            if not plate_text and "plate_crop_bbox" in det and det["plate_crop_bbox"]:
                px1, py1, px2, py2 = [int(c) for c in det["plate_crop_bbox"]]
                px1, py1 = max(0, px1), max(0, py1)
                px2, py2 = min(w, px2), min(h, py2)
                
                if px2 > px1 and py2 > py1:
                    plate_crop = frame[py1:py2, px1:px2]
                    easy_res = ocr_engine.run_single_engine(plate_crop) if ocr_engine else {"text": "", "confidence": 0.0}
                    paddle_res = paddle_engine.run(plate_crop) if paddle_engine else {"text": "", "confidence": 0.0}
                    fused = fuse_ocr_scores(paddle_res.get("text", ""), paddle_res.get("confidence", 0.0),
                                            easy_res.get("text", ""), easy_res.get("confidence", 0.0))
                    plate_text = fused.get("fused_text", "")
                    if fused.get("confidence"):
                        conf = fused.get("confidence")

            # Check if vehicle matches emergency or blacklist
            is_emergency = v_type.lower() in ["ambulance", "fire truck", "police"]
            is_blacklisted = normalize_plate_text(plate_text) in HOTLIST_PLATES if plate_text else False
            
            detections.append({
                "id": f"det_{det.get('track_id', 100)}",
                "vehicleType": v_type,
                "color": color,
                "plate": plate_text or "SCANNING...",
                "confidence": round(float(conf), 2),
                "speed": round(float(speed), 1),
                "box": {
                    "top": round(top_pct, 2),
                    "left": round(left_pct, 2),
                    "width": round(width_pct, 2),
                    "height": round(height_pct, 2)
                },
                "isEmergency": is_emergency,
                "isBlacklisted": is_blacklisted
            })

        return {
            "detections": detections,
            "count": len(detections),
            "camera_id": payload.camera_id
        }

    except Exception as e:
        return {"detections": [], "count": 0, "error": str(e)}
