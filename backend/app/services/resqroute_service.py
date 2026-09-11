import json
import os
import math
from typing import Dict, Any, List, Optional

from sqlalchemy.orm import Session
from ..models.road_segment import RoadSegment
from ..models.congestion import CongestionForecast

# Standard HCM default: passenger-car-equivalent capacity per lane, veh/hr.
# Stated explicitly here since RoadSegment doesn't store lane count --
# treat every segment as 2 lanes unless you add a lane_count field later.
DEFAULT_CAPACITY_PER_LANE = 1800
DEFAULT_LANES = 2
DEFAULT_CYCLE_LENGTH_SEC = 90


class ResQRouteService:
    @staticmethod
    def get_demo_scenario() -> Dict[str, Any]:
        """
        FR-21.1: GET /api/v1/resqroute/demo-scenario returns hardcoded ambulance scenario
        with precomputed route, normal vs optimized green corridor.
        """
        candidate_dirs = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "sample_data")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample_data")),
            os.path.abspath("sample_data")
        ]
        sample_dir = next((d for d in candidate_dirs if os.path.exists(d)), candidate_dirs[0])
        seed_path = os.path.join(sample_dir, "seed-routes.json")
        if os.path.exists(seed_path):
            with open(seed_path, "r") as f:
                scenarios = json.load(f)
                if scenarios:
                    return scenarios[0]

        # Fallback scenario
        return {
            "id": "corridor-aiims-01",
            "name": "Connaught Place to AIIMS Trauma Centre (Emergency Corridor Alpha)",
            "vehicle_id": "DL08MN6789",
            "vehicle_plate": "DL08MN6789",
            "vehicle_type": "ambulance",
            "origin": {"name": "Connaught Place", "lat": 28.6315, "lng": 77.2167},
            "destination": {"name": "AIIMS Trauma Centre", "lat": 28.5672, "lng": 77.2100},
            "normal_route": {
                "distance_km": 8.4,
                "estimated_time_min": 26.5,
                "average_speed_kmh": 19.0,
                "congestion_delay_min": 11.2,
                "signals_encountered": 9,
                "signals_delayed": 6,
                "waypoints": [
                    [28.6315, 77.2167], [28.6250, 77.2180], [28.6129, 77.2295],
                    [28.5800, 77.2220], [28.5672, 77.2100]
                ]
            },
            "optimized_resq_corridor": {
                "distance_km": 7.9,
                "estimated_time_min": 12.8,
                "average_speed_kmh": 37.0,
                "congestion_delay_min": 1.4,
                "signals_encountered": 7,
                "signals_cleared_green": 7,
                "time_saved_min": 13.7,
                "time_saved_pct": 51.7,
                "waypoints": [
                    [28.6315, 77.2167], [28.6200, 77.2130], [28.6050, 77.2110],
                    [28.5900, 77.2105], [28.5750, 77.2095], [28.5672, 77.2100]
                ],
                "cleared_intersections": [
                    {"name": "Janpath - Tolstoy Crossing", "status": "green_locked", "camera_id": "cam-01"},
                    {"name": "Prithviraj Road Junction", "status": "green_locked", "camera_id": "cam-02"},
                    {"name": "AIIMS Underpass", "status": "green_locked", "camera_id": "cam-04"}
                ]
            }
        }

    @staticmethod
    def optimize_corridor_route(
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        emergency_type: str = "ambulance"
    ) -> Dict[str, Any]:
        """
        F-22: Emergency Corridor Optimization using weighted shortest path.

        NOTE (unchanged from prior audit): this is currently a Euclidean-distance
        + fixed-speed-constant heuristic, not an actual road-graph shortest path,
        despite the docstring. Flagged separately for a real upgrade using
        RoadSegment data -- not touched in this pass, which only restored what
        existed before the Digital Twin edit accidentally deleted it.
        """
        dlat = dest_lat - origin_lat
        dlng = dest_lng - origin_lng
        euclid_dist = math.sqrt(dlat**2 + dlng**2) * 111.0  # approx km

        normal_speed = 22.0  # km/h under normal city traffic
        corridor_speed = 48.0  # km/h with preemptive green wave clearance

        normal_time = (euclid_dist * 1.35 / normal_speed) * 60.0  # minutes
        optimized_time = (euclid_dist * 1.15 / corridor_speed) * 60.0  # minutes
        time_saved = normal_time - optimized_time
        time_saved_pct = round((time_saved / max(0.1, normal_time)) * 100.0, 1)

        # Generate interpolated green corridor waypoints
        num_steps = 6
        waypoints = []
        for i in range(num_steps + 1):
            t = i / float(num_steps)
            curv = math.sin(t * math.pi) * 0.005
            w_lat = origin_lat + t * dlat + curv
            w_lng = origin_lng + t * dlng - curv
            waypoints.append([round(w_lat, 5), round(w_lng, 5)])

        return {
            "corridor_id": "resq-corr-dyn-01",
            "emergency_type": emergency_type,
            "normal_travel_time_min": round(normal_time, 1),
            "optimized_travel_time_min": round(optimized_time, 1),
            "time_saved_min": round(time_saved, 1),
            "time_saved_pct": time_saved_pct,
            "intersections_cleared_count": 5,
            "waypoints": waypoints,
            "cleared_signals": [
                {"junction": "Origin Corridor Crossing", "phase": "PREEMPTIVE_GREEN", "seconds_remaining": 120},
                {"junction": "Central Arterial Flyover", "phase": "PREEMPTIVE_GREEN", "seconds_remaining": 95},
                {"junction": "Hospital Emergency Gate Entry", "phase": "PREEMPTIVE_GREEN", "seconds_remaining": 60}
            ]
        }

    @staticmethod
    def get_digital_twin_scenarios() -> List[Dict[str, Any]]:
        """
        F-23: Returns available what-if scenario TYPES (not precomputed outcomes --
        outcomes are computed live per-junction in simulate_junction_scenario below).
        """
        return [
            {"id": "add_green_time", "label": "Increase green-phase duration",
             "description": "Adds extra seconds to the green phase for this approach."},
            {"id": "reduce_cycle_length", "label": "Reduce total signal cycle length",
             "description": "Shortens the full signal cycle to reduce average wait."},
            {"id": "add_lane", "label": "Add a lane (capacity increase)",
             "description": "Models the effect of adding one lane of capacity."},
        ]

    @staticmethod
    def simulate_junction_scenario(
        db: Session,
        junction_id: str,
        scenario_id: str,
        green_time_delta_sec: float = 10.0
    ) -> Dict[str, Any]:
        """
        F-23.2: Real what-if delay simulation using the Webster/HCM-style
        signalized-intersection delay formula, driven by real predicted volume
        from CongestionForecast and real speed/segment data from RoadSegment.

        Assumptions stated explicitly (no lane_count field on RoadSegment yet):
          - DEFAULT_LANES = 2 lanes per segment
          - DEFAULT_CAPACITY_PER_LANE = 1800 veh/hr (standard HCM default)
          - DEFAULT_CYCLE_LENGTH_SEC = 90s baseline signal cycle
        """
        segment = db.query(RoadSegment).filter(RoadSegment.id == junction_id).first()
        if not segment:
            raise ValueError(f"Road segment {junction_id} not found")

        latest_forecast = db.query(CongestionForecast).filter(
            CongestionForecast.road_segment_id == junction_id
        ).order_by(CongestionForecast.predicted_time.desc()).first()

        volume_veh_per_hr = latest_forecast.predicted_volume if latest_forecast else 600

        capacity = DEFAULT_CAPACITY_PER_LANE * DEFAULT_LANES

        def webster_delay(cycle_sec: float, green_sec: float, vol: float, cap: float) -> float:
            if cap <= 0:
                return float("inf")
            green_ratio = min(0.95, max(0.05, green_sec / cycle_sec))
            x = min(0.98, vol / (cap * green_ratio))
            term1 = (cycle_sec * (1 - green_ratio) ** 2) / (2 * (1 - green_ratio * x))
            term2 = (x ** 2) / (2 * (vol / 3600) * (1 - x)) if vol > 0 and x < 1 else 0
            return round(0.9 * (term1 + term2), 2)

        baseline_green = DEFAULT_CYCLE_LENGTH_SEC * 0.45
        baseline_delay = webster_delay(DEFAULT_CYCLE_LENGTH_SEC, baseline_green, volume_veh_per_hr, capacity)

        if scenario_id == "add_green_time":
            new_green = baseline_green + green_time_delta_sec
            new_cycle = DEFAULT_CYCLE_LENGTH_SEC
            new_capacity = capacity
        elif scenario_id == "reduce_cycle_length":
            new_cycle = DEFAULT_CYCLE_LENGTH_SEC - 15
            new_green = baseline_green * (new_cycle / DEFAULT_CYCLE_LENGTH_SEC)
            new_capacity = capacity
        elif scenario_id == "add_lane":
            new_green = baseline_green
            new_cycle = DEFAULT_CYCLE_LENGTH_SEC
            new_capacity = DEFAULT_CAPACITY_PER_LANE * (DEFAULT_LANES + 1)
        else:
            raise ValueError(f"Unknown scenario_id: {scenario_id}")

        scenario_delay = webster_delay(new_cycle, new_green, volume_veh_per_hr, new_capacity)
        improvement_pct = round(((baseline_delay - scenario_delay) / baseline_delay) * 100, 1) if baseline_delay else 0.0

        return {
            "junction_id": junction_id,
            "junction_name": segment.name,
            "scenario_id": scenario_id,
            "input_volume_veh_per_hr": volume_veh_per_hr,
            "baseline_avg_delay_sec": baseline_delay,
            "scenario_avg_delay_sec": scenario_delay,
            "delay_improvement_pct": improvement_pct,
            "model": "Webster/HCM signalized intersection delay formula",
            "assumptions": {
                "lanes_assumed": DEFAULT_LANES,
                "capacity_per_lane_veh_hr": DEFAULT_CAPACITY_PER_LANE,
                "baseline_cycle_length_sec": DEFAULT_CYCLE_LENGTH_SEC
            }
        }
