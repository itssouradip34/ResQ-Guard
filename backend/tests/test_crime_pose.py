import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_crime_simulation_and_police_dispatch():
    payload = {
        "camera_id": "cam-02",
        "action_type": "PHYSICAL_ASSAULT_SLAP",
        "person_count": 2
    }
    response = client.post("/api/v1/crime/simulate-incident", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "POLICE_SOS_DISPATCHED"
    assert "crime_event_id" in data
    assert "dispatched_patrol_unit" in data
    assert "nearest_police_station" in data

    # Verify event appears in crime list
    list_res = client.get("/api/v1/crime/events")
    assert list_res.status_code == 200
    events = list_res.json()
    assert len(events) > 0
    matched = next((e for e in events if e["id"] == data["crime_event_id"]), None)
    assert matched is not None
    assert matched["action_type"] == "PHYSICAL_ASSAULT_SLAP"
    assert matched["police_sos_dispatched"] is True
