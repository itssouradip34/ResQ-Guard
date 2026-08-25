from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...schemas.incident import IncidentOut
from ...services.incident_service import IncidentService
from ...core.security import get_role_context, RoleContext, mask_plate

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentOut], summary="List AI-detected traffic incidents")
def list_incidents(
    incident_type: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    role_ctx: RoleContext = Depends(get_role_context)
):
    """FR-12.5: GET /api/v1/incidents surfaces live AI incident feed."""
    incidents = IncidentService.get_incidents(db, incident_type, limit, offset)
    if not role_ctx.is_authority:
        for inc in incidents:
            if inc.get("vehicle_plate"):
                inc["vehicle_plate"] = mask_plate(inc["vehicle_plate"])
    return incidents
