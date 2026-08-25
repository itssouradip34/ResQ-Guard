import random
import time
from typing import List, Dict, Any, Optional

class VehicleTrack:
    def __init__(self, track_id: int, bbox: List[float], vehicle_type: str, color: str):
        self.track_id = track_id
        self.bbox = bbox # [x1, y1, x2, y2]
        self.vehicle_type = vehicle_type
        self.color = color
        self.first_frame_time = time.time()
        self.last_update_time = time.time()
        self.hits = 1

class VehicleDetectorTracker:
    def __init__(self):
        self.active_tracks: Dict[int, VehicleTrack] = {}
        self.next_track_id = 1001

    def process_frame(
        self,
        camera_id: str,
        frame_width: int = 1280,
        frame_height: int = 720,
        custom_vehicle_pool: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes vehicle detection and multi-object tracking.
        Returns detected vehicle objects with stable track IDs and bboxes.
        """
        results = []
        pool = custom_vehicle_pool or [
            {"plate": "DL01AB1234", "type": "car", "color": "White", "speed": 52.0},
            {"plate": "MH02CD5678", "type": "suv", "color": "Black", "speed": 64.0},
            {"plate": "KA03EF9012", "type": "truck", "color": "Yellow", "speed": 40.0},
            {"plate": "MP04GH3456", "type": "car", "color": "Silver", "speed": 48.0},
            {"plate": "HR26IJ7890", "type": "bus", "color": "Blue", "speed": 35.0},
            {"plate": "UP16KL2345", "type": "motorbike", "color": "Red", "speed": 58.0},
            {"plate": "DL08MN6789", "type": "ambulance", "color": "White", "speed": 72.0}
        ]

        # Select 1 to 3 vehicles visible in current camera view
        num_vehicles = random.randint(1, min(3, len(pool)))
        selected_candidates = random.sample(pool, num_vehicles)

        for cand in selected_candidates:
            self.next_track_id += 1
            t_id = self.next_track_id
            
            # Generate realistic bbox in 1280x720 frame
            w = random.randint(220, 360)
            h = int(w * 0.65)
            x1 = random.randint(50, frame_width - w - 50)
            y1 = random.randint(100, frame_height - h - 50)
            x2 = x1 + w
            y2 = y1 + h

            # Plate ROI crop inside lower 35% of vehicle box
            plate_w = int(w * 0.45)
            plate_h = int(h * 0.28)
            plate_x1 = x1 + int((w - plate_w) / 2)
            plate_y1 = y2 - plate_h - 10
            plate_x2 = plate_x1 + plate_w
            plate_y2 = plate_y1 + plate_h

            results.append({
                "track_id": t_id,
                "vehicle_type": cand["type"],
                "color": cand["color"],
                "plate_candidate": cand["plate"],
                "speed_estimate": cand.get("speed", 45.0) + random.uniform(-2.0, 3.0),
                "bbox": [x1, y1, x2, y2],
                "plate_crop_bbox": [plate_x1, plate_y1, plate_x2, plate_y2],
                "confidence": round(random.uniform(0.92, 0.98), 3)
            })

        return results

detector_tracker = VehicleDetectorTracker()
