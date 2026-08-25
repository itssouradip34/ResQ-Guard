from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from ...services.resqroute_service import ResQRouteService

router = APIRouter(prefix="/digital-twin", tags=["Digital Twin & What-If Simulation"])

@router.get("/scenarios", summary="Get available junction what-if simulation scenarios")
def get_scenarios():
    """FR-23.1: Returns pre-built junction simulation scenarios."""
    return ResQRouteService.get_digital_twin_scenarios()

@router.get("/junction/{junction_id}/simulate", summary="Run what-if scenario simulation on a junction")
def simulate_junction(
    junction_id: str,
    scenario_id: str = Query(..., description="Scenario ID to simulate")
):
    """FR-23.2: Returns precomputed outcomes for junction modifications."""
    scenarios = ResQRouteService.get_digital_twin_scenarios()
    for sc in scenarios:
        if sc.get("id") == scenario_id:
            return sc
    if scenarios:
        return scenarios[0]
    raise HTTPException(status_code=404, detail="Simulation scenario not found")
