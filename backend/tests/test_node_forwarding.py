import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_node_forwarding_metrics():
    response = client.get("/api/v1/node-forwarding/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_registered_tokens" in data
    assert "bandwidth_reduction_pct" in data
    assert data["bandwidth_reduction_pct"] > 70.0
    assert data["average_packet_size_bytes"] == 128

def test_vehicle_token_handoff_lifecycle():
    payload = {
        "plate_number": "DL01AB9999",
        "camera_id": "cam-01",
        "lat": 28.6315,
        "lng": 77.2167,
        "vehicle_type": "car",
        "color": "Black",
        "speed_kmh": 50.0
    }
    response = client.post("/api/v1/node-forwarding/handoff", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "token_id" in data
    assert data["plate_number"] == "DL01AB9999"
    assert "dispatched_handoff_packets" in data

    # Verify token appears in tokens list
    tokens_res = client.get("/api/v1/node-forwarding/tokens")
    assert tokens_res.status_code == 200
    tokens = tokens_res.json()
    assert any(t["plate_number"] == "DL01AB9999" for t in tokens)
