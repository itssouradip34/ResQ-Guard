from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.vehicle import Vehicle
from ..cv_pipeline.dna_extractor import compute_cosine_similarity

class VehicleDNAService:
    @staticmethod
    def find_similar_vehicles(
        db: Session,
        vehicle_id: str,
        top_n: int = 5,
        threshold: float = 0.60
    ) -> List[Dict[str, Any]]:
        """
        FR-11.3: GET /api/v1/vehicle-dna/similar?vehicle_id=...
        Returns top-N visually similar vehicles by cosine distance —
        useful when plate is unreadable, blurred, or obscured.
        """
        target = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not target or not target.dna_embedding:
            return []

        target_vector = target.dna_embedding
        candidates = db.query(Vehicle).filter(Vehicle.id != vehicle_id).all()
        
        scored = []
        for cand in candidates:
            if not cand.dna_embedding:
                continue
            sim = compute_cosine_similarity(target_vector, cand.dna_embedding)
            if sim >= threshold:
                # Deduce similarity reasoning
                reasons = []
                if cand.vehicle_type == target.vehicle_type:
                    reasons.append(f"Matching vehicle body type ({cand.vehicle_type})")
                if cand.color.lower() == target.color.lower():
                    reasons.append(f"Matching vehicle exterior color ({cand.color})")
                reasons.append(f"Visual embedding cosine match: {round(sim * 100, 1)}%")

                scored.append({
                    "vehicle": {
                        "id": cand.id,
                        "plate_number": cand.plate_number,
                        "plate_hash": cand.plate_hash,
                        "vehicle_type": cand.vehicle_type,
                        "color": cand.color,
                        "is_blacklisted": cand.is_blacklisted,
                        "first_seen": cand.first_seen.isoformat(),
                        "last_seen": cand.last_seen.isoformat(),
                    },
                    "similarity_score": sim,
                    "reason": "; ".join(reasons)
                })

        # Sort descending by similarity score
        scored.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored[:top_n]
