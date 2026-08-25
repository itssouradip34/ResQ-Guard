import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_event_ingestion_valid():
    payload = {
        "camera_id": "cam-01",
        "plate_text": "DL01AB1234",
        "confidence": 0.96,
        "vehicle_type": "car",
        "color": "White",
        "speed_estimate": 48.5
    }
    response = client.post("/api/v1/ingestion/event", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["plate_text"] == "DL01AB1234"
    assert data["camera_id"] == "cam-01"
    assert data["vehicle_id"] is not None

def test_event_ingestion_malformed():
    payload = {
        "camera_id": "cam-01",
        "plate_text": "",
        "confidence": 0.5
    }
    response = client.post("/api/v1/ingestion/event", json=payload)
    assert response.status_code == 422
