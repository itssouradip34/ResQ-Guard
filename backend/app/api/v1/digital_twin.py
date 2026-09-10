from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services.resqroute_service import ResQRouteService

router = APIRouter(prefix="/digital-twin", tags=["Digital Twin & What-If Simulation"])

@router.get("/scenarios", summary="Get available junction what-if simulation scenario types")
def get_scenarios():
    """FR-23.1: Returns available scenario types for the client to offer."""
    return ResQRouteService.get_digital_twin_scenarios()

@router.get("/junction/{junction_id}/simulate", summary="Run real what-if delay simulation on a junction")
def simulate_junction(
    junction_id: str,
    scenario_id: str = Query(..., description="Scenario ID to simulate"),
    green_time_delta_sec: float = Query(default=10.0, description="Extra green-phase seconds, for add_green_time scenario"),
    db: Session = Depends(get_db)
):
    """FR-23.2: Runs a real Webster/HCM delay calculation against live congestion data."""
    try:
        return ResQRouteService.simulate_junction_scenario(db, junction_id, scenario_id, green_time_delta_sec)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))