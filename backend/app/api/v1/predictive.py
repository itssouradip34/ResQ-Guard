from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...schemas.trajectory import PredictiveTrajectoryOut
from ...services.trajectory_service import TrajectoryService
from ...core.security import get_role_context, RoleContext, mask_plate

router = APIRouter(prefix="/predictive", tags=["Predictive Analytics"])

@router.get("/trajectory/{vehicle_id}", response_model=PredictiveTrajectoryOut, summary="Predict top-3 likely next camera nodes using Markov model")
def predict_trajectory(
    vehicle_id: str,
    db: Session = Depends(get_db),
    role_ctx: RoleContext = Depends(get_role_context)
):
    """FR-13.2: GET /api/v1/predictive/trajectory/{vehicle_id} returns top-3 likely next camera nodes with probabilities."""
    res = TrajectoryService.predict_next_trajectory(db, vehicle_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    
    if not role_ctx.is_authority:
        res["plate_number"] = mask_plate(res["plate_number"])
        
    return res
