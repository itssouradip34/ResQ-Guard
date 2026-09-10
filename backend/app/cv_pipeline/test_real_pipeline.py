"""
Standalone smoke test for detector.py + ocr_engine.py, using a real image or
video file -- run this BEFORE touching stream_runner.py, so you're testing
the two new pieces in isolation rather than debugging them through the full
FastAPI + WebSocket stack.

Usage:
    python test_real_pipeline.py path/to/image.jpg
    python test_real_pipeline.py path/to/video.mp4

This does not require step 3 (RTSP ingestion) to be built -- it reads
straight from a local file, which is enough to confirm detection + OCR are
actually working on real pixels instead of the random generator.
"""

import sys
import cv2

from detector import detector_tracker
from ocr_engine import ocr_engine, run_single_engine


def process_single_frame(frame):
    detections = detector_tracker.process_frame(camera_id="test-cam", frame=frame)

    if not detections:
        print("No plates detected in this frame.")
        return

    for det in detections:
        x1, y1, x2, y2 = [int(v) for v in det["plate_crop_bbox"]]
        plate_crop = frame[y1:y2, x1:x2]

        ocr_result = run_single_engine(plate_crop, ocr_engine)

        print(
            f"track_id={det['track_id']} vehicle_type={det['vehicle_type']} "
            f"detector_conf={det['confidence']:.3f} | "
            f"plate='{ocr_result['final_plate']}' "
            f"ocr_conf={ocr_result['fused_confidence']:.3f} "
            f"valid={ocr_result['plate_format_valid']} "
            f"needs_review={ocr_result['needs_review']}"
        )


def main():
    if len(sys.argv) != 2:
        print("Usage: python test_real_pipeline.py <image_or_video_path>")
        sys.exit(1)

    path = sys.argv[1]

    if path.lower().endswith((".jpg", ".jpeg", ".png")):
        frame = cv2.imread(path)
        if frame is None:
            print(f"Could not read image: {path}")
            sys.exit(1)
        process_single_frame(frame)
    else:
        cap = cv2.VideoCapture(path)
        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frame_count += 1
            # Sample every 15th frame instead of every frame -- fast enough
            # to eyeball results, not so slow you're waiting on every frame.
            if frame_count % 15 != 0:
                continue
            print(f"--- frame {frame_count} ---")
            process_single_frame(frame)
        cap.release()


if __name__ == "__main__":
    main()
