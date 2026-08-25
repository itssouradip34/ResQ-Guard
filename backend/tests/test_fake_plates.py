import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_type_mismatch_fake_plate_alert():
    # Plate DL03XY9999 is registered as motorbike in mock registry, but sent as truck
    payload = {
        "camera_id": "cam-01",
        "plate_text": "DL03XY9999",
        "confidence": 0.95,
        "vehicle_type": "truck",
        "color": "Red",
        "speed_estimate": 45.0
    }
    res = client.post("/api/v1/ingestion/event", json=payload)
    assert res.status_code == 201
    
    # Check if alert generated
    alerts_res = client.get("/api/v1/alerts?alert_type=fake_plate_suspected")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert any("DL03XY9999" in a["message"] for a in alerts)

def test_ai_assistant_query():
    query_payload = {"query": "How many vehicles crossed today?"}
    res = client.post("/api/v1/assistant/query", json=query_payload)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert "generated_sql" in data

def test_resqroute_scenario():
    res = client.get("/api/v1/resqroute/demo-scenario")
    assert res.status_code == 200
    data = res.json()
    assert "normal_route" in data
    assert "optimized_resq_corridor" in data
    assert data["optimized_resq_corridor"]["time_saved_pct"] > 40

def test_digital_twin_scenarios():
    res = client.get("/api/v1/digital-twin/scenarios")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 2
    assert "delta_percentage" in data[0]
