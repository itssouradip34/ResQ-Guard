from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...schemas.assistant import VehicleSearchDescribeRequest, VehicleSearchCandidate
from ...services.assistant_service import AssistantService
from ...core.security import get_role_context, RoleContext, mask_plate, log_audit_event

router = APIRouter(prefix="/search", tags=["Vehicle Search"])

@router.post("/describe", response_model=List[VehicleSearchCandidate], summary="Multi-modal search by natural description & visual features")
def search_describe(
    payload: VehicleSearchDescribeRequest,
    db: Session = Depends(get_db),
    role_ctx: RoleContext = Depends(get_role_context)
):
    """
    FR-18.1 & FR-18.2: Parses attributes (color, type, zone, time) from free-text and ranks candidate events.
    FR-18.3: Returns ranked candidate list with snapshot thumbnails.
    """
    if not payload.description.strip():
        raise HTTPException(status_code=422, detail="Description text is required")

    log_audit_event(
        db,
        actor_role=role_ctx.role,
        action="search_describe",
        target_type="vehicle"
    )

    candidates = AssistantService.describe_search_vehicles(
        db,
        description=payload.description,
        color=payload.color,
        vehicle_type=payload.vehicle_type,
        zone=payload.zone,
        reference_embedding=payload.reference_embedding
    )

    if not role_ctx.is_authority:
        for c in candidates:
            c["plate_number"] = mask_plate(c["plate_number"])

    return candidates
