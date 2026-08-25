from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...schemas.vehicle import VehicleDNASimilarResult
from ...services.vehicle_dna_service import VehicleDNAService
from ...core.security import get_role_context, RoleContext, mask_plate

router = APIRouter(prefix="/vehicle-dna", tags=["Vehicle DNA & Re-ID"])

@router.get("/similar", response_model=List[VehicleDNASimilarResult], summary="Find visually similar vehicles via Vehicle DNA embedding")
def find_similar(
    vehicle_id: str = Query(..., description="Target vehicle ID to compare embeddings"),
    top_n: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
    role_ctx: RoleContext = Depends(get_role_context)
):
    """
    FR-11.3: GET /api/v1/vehicle-dna/similar?vehicle_id=...
    Returns top-N visually similar vehicles by cosine distance.
    """
    results = VehicleDNAService.find_similar_vehicles(db, vehicle_id, top_n)
    if not role_ctx.is_authority:
        for r in results:
            r["vehicle"]["plate_number"] = mask_plate(r["vehicle"]["plate_number"])
    return results
