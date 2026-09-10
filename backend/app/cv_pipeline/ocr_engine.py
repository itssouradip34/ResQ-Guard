"""
Real plate OCR for ResQ-Guard's cv_pipeline.

Replaces stream_runner.py's current behavior of feeding the SAME fake plate
string into fuse_ocr_scores() twice as if it came from two engines. This
module actually runs your fine-tuned EasyOCR recognizer against a real
cropped plate image.

Fusion honesty note: fuse_ocr_scores() in plate_ocr.py is designed for two
independent engines (PaddleOCR + EasyOCR). Since you currently have one
fine-tuned engine (EasyOCR), this module exposes a single-engine confidence
path instead of faking a second opinion -- run_single_engine() below.
If/when you add a second real engine, wire it in next to this one and go
back to fuse_ocr_scores() for genuine cross-engine agreement scoring.
"""

import os
from typing import Dict, Any, Tuple

import numpy as np
import easyocr

# --- Config -------------------------------------------------------------
# Your fine-tuned EasyOCR model. EasyOCR's Reader loads custom models by
# model_storage_directory + recog_network name (matching how your
# trainer/config_files/en_filtered_config.yaml + saved_models are laid out).
EASYOCR_MODEL_STORAGE_DIR = os.getenv(
    "EASYOCR_MODEL_STORAGE_DIR",
    "D:/Desktop/EasyOCR/trainer/saved_models/plate_finetune",  # adjust per-deploy
)
EASYOCR_USER_NETWORK_DIR = os.getenv(
    "EASYOCR_USER_NETWORK_DIR",
    "D:/Desktop/EasyOCR/trainer/config_files",
)
EASYOCR_RECOG_NETWORK = os.getenv("EASYOCR_RECOG_NETWORK", "en_filtered_config")
EASYOCR_GPU = os.getenv("EASYOCR_GPU", "true").lower() == "true"


class PlateOCREngine:
    def __init__(self):
        # lang_list=['en'] is right for Indian plates (Latin alphanumeric).
        # If EASYOCR_MODEL_STORAGE_DIR/EASYOCR_RECOG_NETWORK don't point at a
        # valid fine-tuned checkpoint, this silently falls back to EasyOCR's
        # stock English recognizer -- check reader.recognizer at startup if
        # results look off.
        self.reader = easyocr.Reader(
            ["en"],
            gpu=EASYOCR_GPU,
            model_storage_directory=EASYOCR_MODEL_STORAGE_DIR,
            user_network_directory=EASYOCR_USER_NETWORK_DIR,
            recog_network=EASYOCR_RECOG_NETWORK,
        )

    def read_plate(self, plate_crop: np.ndarray) -> Tuple[str, float]:
        """
        Runs OCR on a single cropped plate image.

        Args:
            plate_crop: BGR or grayscale numpy array of just the plate region
                        (use detector.py's plate_crop_bbox to crop this from
                        the full frame before calling).

        Returns: (raw_text, confidence) -- confidence is EasyOCR's own
                 per-detection confidence, averaged if multiple text
                 fragments were found on the crop (rare for a tight crop,
                 but plates with two-line stacked text can split).
        """
        if plate_crop is None or plate_crop.size == 0:
            return "", 0.0

        detections = self.reader.readtext(plate_crop)
        if not detections:
            return "", 0.0

        # Concatenate fragments (handles rare 2-line plates), average confidence
        texts = [d[1] for d in detections]
        confs = [d[2] for d in detections]
        combined_text = "".join(texts)
        avg_conf = sum(confs) / len(confs)

        return combined_text, round(float(avg_conf), 4)


def run_single_engine(plate_crop: np.ndarray, engine: PlateOCREngine) -> Dict[str, Any]:
    """
    Single-engine equivalent of plate_ocr.py's fuse_ocr_scores(), for use
    until you have a genuine second engine to cross-check against. Reuses
    the real normalize/validate logic from plate_ocr.py -- import it from
    your existing module rather than duplicating it here.
    """
    from app.cv_pipeline.plate_ocr import normalize_plate_text, validate_indian_plate

    raw_text, conf = engine.read_plate(plate_crop)
    norm = normalize_plate_text(raw_text)
    is_valid, reason = validate_indian_plate(norm)

    # No second engine to cross-check against, so "needs_review" leans more
    # heavily on raw confidence and format validity than the two-engine
    # version does -- tune these thresholds against your check_ocr_accuracy.py
    # numbers once this is live.
    needs_review = (not is_valid) or conf < 0.85

    return {
        "final_plate": norm,
        "fused_confidence": conf,  # not actually "fused" -- single engine, kept the field name for schema compatibility
        "plate_format_valid": is_valid,
        "plate_format_reason": reason,
        "needs_review": needs_review,
        "ocr_engine_scores": {
            "easy_ocr": {"text": norm, "conf": conf},
        },
    }


ocr_engine = PlateOCREngine()
