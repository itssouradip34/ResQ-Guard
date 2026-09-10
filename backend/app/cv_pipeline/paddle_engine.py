"""
Real PaddleOCR engine for ResQ-Guard's cv_pipeline.

Mirrors ocr_engine.py's shape exactly, so both engines can feed into
plate_ocr.py's fuse_ocr_scores() for genuine dual-engine confidence fusion.

Runs on CPU by default (use_gpu=False) -- running two GPU-hungry OCR
frameworks alongside YOLO detection on the same card is the most likely way
this breaks during a live demo. Plate crops are small, so CPU inference here
is fast enough; this isn't running on full video frames.
"""

import os
from typing import Tuple

import numpy as np
from paddleocr import PaddleOCR

PADDLE_USE_GPU = os.getenv("PADDLE_USE_GPU", "false").lower() == "true"
PADDLE_LANG = os.getenv("PADDLE_LANG", "en")


class PlatePaddleEngine:
    def __init__(self):
        # use_angle_cls=False -- plate crops from detector.py are already
        # roughly upright, don't need PaddleOCR's angle-classification step.
        self.reader = PaddleOCR(
            use_angle_cls=False,
            lang=PADDLE_LANG,
            use_gpu=PADDLE_USE_GPU,
            show_log=False,
        )

    def read_plate(self, plate_crop: np.ndarray) -> Tuple[str, float]:
        """
        Runs PaddleOCR on a single cropped plate image.

        Args:
            plate_crop: BGR or grayscale numpy array of just the plate region
                        (same crop passed to ocr_engine.py's EasyOCR reader).

        Returns: (raw_text, confidence) -- confidence is PaddleOCR's own
                 per-line confidence, averaged across lines if the plate
                 crop produced multiple text fragments.
        """
        if plate_crop is None or plate_crop.size == 0:
            return "", 0.0

        result = self.reader.ocr(plate_crop, cls=False)

        # PaddleOCR returns [[[box, (text, conf)], ...]] per image, or
        # [None] / [[]] when nothing is detected -- guard against both.
        if not result or not result[0]:
            return "", 0.0

        lines = result[0]
        texts = [line[1][0] for line in lines]
        confs = [line[1][1] for line in lines]

        combined_text = "".join(texts)
        avg_conf = sum(confs) / len(confs) if confs else 0.0

        return combined_text, round(float(avg_conf), 4)


paddle_engine = PlatePaddleEngine()