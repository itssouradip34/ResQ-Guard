from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...schemas.trajectory import TrajectoryOut
from ...services.trajectory_service import TrajectoryService
from ...core.security import get_role_context, RoleContext, mask_plate

router = APIRouter(prefix="/vehicles", tags=["Trajectories"])

@router.get("/{vehicle_id}/trajectory", response_model=TrajectoryOut, summary="Get stitched multi-camera trajectory as GeoJSON")
def get_trajectory(
    vehicle_id: str,
    db: Session = Depends(get_db),
    role_ctx: RoleContext = Depends(get_role_context)
):
    """FR-06.3: Returns stitched multi-camera spatial path as GeoJSON with timestamps."""
    traj = TrajectoryService.get_vehicle_trajectory(db, vehicle_id)
    if not traj:
        raise HTTPException(status_code=404, detail="Trajectory not found for vehicle")

    if not role_ctx.is_authority:
        traj["plate_number"] = mask_plate(traj["plate_number"])

    return traj
