import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_accident_simulation_and_sos_dispatch():
    payload = {
        "camera_id": "cam-01",
        "trigger_type": "SPATIAL_COLLISION_OVERLAP",
        "primary_plate": "DL02XX1234",
        "secondary_plate": "MH04YY5678",
        "lateral_accel_ms2": 7.2,
        "acoustic_db_level": 108.0
    }
    response = client.post("/api/v1/accidents/simulate-crash", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SOS_DISPATCHED"
    assert "incident_id" in data
    assert "sos_dispatch_id" in data

    # Verify incident is in incident list with active SOS
    inc_res = client.get("/api/v1/accidents/incidents")
    assert inc_res.status_code == 200
    incidents = inc_res.json()
    assert len(incidents) > 0
    matched = next((i for i in incidents if i["id"] == data["incident_id"]), None)
    assert matched is not None
    assert matched["sos_activated"] is True
    assert matched["sos_dispatch"] is not None
    assert "hospital_name" in matched["sos_dispatch"]
    assert "ambulance_id" in matched["sos_dispatch"]

def test_list_sos_dispatches():
    res = client.get("/api/v1/accidents/dispatches")
    assert res.status_code == 200
    dispatches = res.json()
    assert isinstance(dispatches, list)
    if len(dispatches) > 0:
        d = dispatches[0]
        assert "nearest_hospital_name" in d
        assert "dispatched_ambulance_id" in d
        assert "estimated_arrival_minutes" in d
