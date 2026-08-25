from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...schemas.analytics import TrafficVolumeSeries, HeatmapGeoJSON, TrafficDashboardSummary, CongestionForecastOut
from ...services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/traffic-volume", response_model=List[TrafficVolumeSeries], summary="Get time-bucketed traffic volume series")
def get_traffic_volume(
    hours: int = Query(default=24, ge=1, le=72),
    db: Session = Depends(get_db)
):
    """FR-08.2: Returns time-bucketed traffic series by vehicle type and camera."""
    return AnalyticsService.get_traffic_volume(db, hours)

@router.get("/heatmap", summary="Get zone-level traffic density as GeoJSON")
def get_heatmap(db: Session = Depends(get_db)):
    """FR-08.3: Returns zone-level density and congestion index as GeoJSON polygon layer."""
    return AnalyticsService.get_heatmap_geojson(db)

@router.get("/summary", response_model=TrafficDashboardSummary, summary="Get city-wide dashboard summary metrics")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """FR-08.4: Total vehicles today, peak hour, top zone, vehicle breakdown."""
    return AnalyticsService.get_dashboard_summary(db)

@router.get("/congestion-forecast", response_model=List[CongestionForecastOut], summary="Predictive congestion forecast for next 15/30/60 mins")
def get_congestion_forecast(db: Session = Depends(get_db)):
    """F-14: Congestion forecasting per road segment."""
    return AnalyticsService.get_predictive_congestion_forecast(db)
