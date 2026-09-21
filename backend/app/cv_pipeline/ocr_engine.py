"""
Real plate OCR for ResQ-Guard's cv_pipeline.
"""

import os
from typing import Dict, Any, Tuple
import numpy as np

try:
    import easyocr
except ImportError:
    easyocr = None

EASYOCR_MODEL_STORAGE_DIR = os.getenv(
    "EASYOCR_MODEL_STORAGE_DIR",
    "D:/Desktop/EasyOCR/trainer/saved_models/plate_finetune",
)
EASYOCR_USER_NETWORK_DIR = os.getenv(
    "EASYOCR_USER_NETWORK_DIR",
    "D:/Desktop/EasyOCR/trainer/config_files",
)
EASYOCR_RECOG_NETWORK = os.getenv("EASYOCR_RECOG_NETWORK", "en_filtered_config")
EASYOCR_GPU = os.getenv("EASYOCR_GPU", "false").lower() == "true"


class PlateOCREngine:
    def __init__(self):
        self.reader = None
        if easyocr is None:
            return
        try:
            if os.path.isdir(EASYOCR_MODEL_STORAGE_DIR) and os.path.isdir(EASYOCR_USER_NETWORK_DIR):
                self.reader = easyocr.Reader(
                    ["en"],
                    gpu=EASYOCR_GPU,
                    model_storage_directory=EASYOCR_MODEL_STORAGE_DIR,
                    user_network_directory=EASYOCR_USER_NETWORK_DIR,
                    recog_network=EASYOCR_RECOG_NETWORK,
                )
            else:
                self.reader = easyocr.Reader(["en"], gpu=EASYOCR_GPU)
        except Exception:
            try:
                self.reader = easyocr.Reader(["en"], gpu=False)
            except Exception:
                self.reader = None

    def read_plate(self, plate_crop: np.ndarray) -> Tuple[str, float]:
        """Runs OCR on cropped plate image."""
        if plate_crop is None or plate_crop.size == 0 or self.reader is None:
            return "", 0.0

        try:
            detections = self.reader.readtext(plate_crop)
        except Exception:
            return "", 0.0

        if not detections:
            return "", 0.0

        texts = [d[1] for d in detections]
        confs = [d[2] for d in detections]
        combined_text = "".join(texts)
        avg_conf = sum(confs) / len(confs)

        return combined_text, round(float(avg_conf), 4)

    def run_single_engine(self, plate_crop: np.ndarray) -> Dict[str, Any]:
        """Convenience single-engine output dict."""
        raw_text, conf = self.read_plate(plate_crop)
        return {"text": raw_text, "confidence": conf}


ocr_engine = PlateOCREngine()
