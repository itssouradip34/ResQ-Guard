import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_cameras_list():
    response = client.get("/api/v1/cameras")
    assert response.status_code == 200
    cameras = response.json()
    assert len(cameras) >= 3
    assert any(c["id"] == "cam-01" for c in cameras)

def test_camera_health():
    response = client.get("/api/v1/cameras/cam-01/health")
    assert response.status_code == 200
    data = response.json()
    assert data["camera_id"] == "cam-01"
    assert "uptime_percentage" in data

def test_camera_heartbeat():
    payload = {"camera_id": "cam-01", "fps": 26.5, "status": "online"}
    response = client.post("/api/v1/cameras/cam-01/heartbeat", json=payload)
    assert response.status_code == 200
    assert response.json()["fps"] == 26.5
