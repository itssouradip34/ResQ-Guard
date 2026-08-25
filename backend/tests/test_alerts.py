import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_list_alerts():
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert isinstance(alerts, list)

def test_acknowledge_alert():
    response = client.get("/api/v1/alerts")
    alerts = response.json()
    if alerts:
        target_id = alerts[0]["id"]
        ack_res = client.post(f"/api/v1/alerts/{target_id}/acknowledge", json={"acknowledged_by": "Inspector Rao"})
        assert ack_res.status_code == 200
        assert ack_res.json()["acknowledged"] is True
        assert ack_res.json()["acknowledged_by"] == "Inspector Rao"

def test_alert_explanation():
    response = client.get("/api/v1/alerts")
    alerts = response.json()
    if alerts:
        target_id = alerts[0]["id"]
        exp_res = client.get(f"/api/v1/alerts/{target_id}/explanation")
        assert exp_res.status_code == 200
        data = exp_res.json()
        assert "rules_triggered" in data
        assert "summary" in data
