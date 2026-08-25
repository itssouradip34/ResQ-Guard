from fastapi import APIRouter, HTTPException
from ...schemas.resqroute import ResQRouteScenario, EmergencyCorridorRequest, EmergencyCorridorResponse
from ...services.resqroute_service import ResQRouteService

router = APIRouter(prefix="/resqroute", tags=["ResQRoute 2.0 Emergency Corridor"])

@router.get("/demo-scenario", response_model=ResQRouteScenario, summary="Get full precomputed demo emergency ambulance corridor scenario")
def get_demo_scenario():
    """FR-21.1: Returns active demo emergency corridor with normal vs optimized route."""
    return ResQRouteService.get_demo_scenario()

@router.post("/optimize", response_model=EmergencyCorridorResponse, summary="Compute dynamic congestion-weighted emergency green corridor")
def optimize_corridor(payload: EmergencyCorridorRequest):
    """FR-22.1: Computes green corridor shortest path and time-saved metrics."""
    return ResQRouteService.optimize_corridor_route(
        origin_lat=payload.origin_lat,
        origin_lng=payload.origin_lng,
        dest_lat=payload.dest_lat,
        dest_lng=payload.dest_lng,
        emergency_type=payload.emergency_type
    )
