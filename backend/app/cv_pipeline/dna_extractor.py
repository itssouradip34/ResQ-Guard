import numpy as np
from typing import List, Optional

def extract_vehicle_dna_from_crop(image_array: Optional[np.ndarray], vehicle_type: str = "car", color: str = "White") -> List[float]:
    """
    Computes a normalized 8-dimensional Vehicle DNA embedding vector:
    - Dimensions 0-2: Color distribution (R, G, B balance or Hue/Saturation)
    - Dimensions 3-4: Aspect ratio & scale features
    - Dimensions 5-7: Texture & edge complexity features
    """
    if image_array is not None and isinstance(image_array, np.ndarray) and image_array.size > 0:
        # Calculate color moments
        r_mean = float(np.mean(image_array[:, :, 0])) / 255.0 if image_array.ndim >= 3 else 0.5
        g_mean = float(np.mean(image_array[:, :, 1])) / 255.0 if image_array.ndim >= 3 else 0.5
        b_mean = float(np.mean(image_array[:, :, 2])) / 255.0 if image_array.ndim >= 3 else 0.5
        
        # Calculate aspect ratio
        h, w = image_array.shape[:2]
        aspect = float(w / max(1, h)) / 3.0 # normalized
        std_intensity = float(np.std(image_array)) / 128.0
        
        vector = [
            round(r_mean, 4),
            round(g_mean, 4),
            round(b_mean, 4),
            round(min(1.0, aspect), 4),
            round(min(1.0, std_intensity), 4),
            round(float(np.median(image_array)) / 255.0, 4),
            round(float(np.percentile(image_array, 75)) / 255.0, 4),
            round(float(np.percentile(image_array, 25)) / 255.0, 4)
        ]
        return vector

    # Deterministic fallback synthetic embedding based on visual attributes
    color_map = {
        "white": [0.92, 0.92, 0.94, 0.60, 0.20, 0.90, 0.95, 0.85],
        "black": [0.12, 0.14, 0.15, 0.65, 0.25, 0.15, 0.20, 0.10],
        "silver": [0.70, 0.72, 0.75, 0.62, 0.30, 0.72, 0.78, 0.65],
        "red": [0.88, 0.18, 0.15, 0.55, 0.45, 0.50, 0.70, 0.30],
        "blue": [0.15, 0.35, 0.88, 0.68, 0.40, 0.52, 0.65, 0.38],
        "yellow": [0.90, 0.85, 0.15, 0.70, 0.35, 0.75, 0.85, 0.60],
        "green": [0.18, 0.78, 0.25, 0.60, 0.38, 0.55, 0.70, 0.40]
    }
    base = color_map.get(color.lower(), [0.5, 0.5, 0.5, 0.6, 0.3, 0.5, 0.6, 0.4])
    
    # Adjust slightly by vehicle type
    type_shift = {"car": 0.0, "suv": 0.05, "truck": 0.15, "bus": 0.20, "motorbike": -0.10, "ambulance": 0.08}
    shift = type_shift.get(vehicle_type.lower(), 0.0)
    adjusted = [round(min(1.0, max(0.0, val + (i % 2 == 0 and shift or -shift))), 4) for i, val in enumerate(base)]
    return adjusted

def compute_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Computes cosine similarity between two 8D visual DNA embeddings."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    a = np.array(vec1, dtype=float)
    b = np.array(vec2, dtype=float)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    similarity = float(np.dot(a, b) / (norm_a * norm_b))
    return round(max(0.0, min(1.0, similarity)), 4)
