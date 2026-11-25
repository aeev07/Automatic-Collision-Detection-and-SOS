import pytest
from fastapi.testclient import TestClient
from collision_engine.api.main import app
from collision_engine.api.schemas import SeverityLevel


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "collision_engine"


def test_analyze_contract_sample(client):
    """
    Test using the exact sample from docs/CONTRACTS.md:
    Request:
    {
      "vehicle_id": "VH-101",
      "timestamp": "2026-11-24T14:30:00Z",
      "readings": [
        {"t_ms": 0, "ax": 0.1, "ay": 0.0, "az": 1.0, "gx": 0.0, "gy": 0.0, "gz": 0.0}
      ]
    }
    """
    payload = {
        "vehicle_id": "VH-101",
        "timestamp": "2026-11-24T14:30:00Z",
        "readings": [
            {"t_ms": 0, "ax": 0.1, "ay": 0.0, "az": 1.0, "gx": 0.0, "gy": 0.0, "gz": 0.0}
        ]
    }
    response = client.post("/api/v1/collision/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Verify contract keys
    assert "event_id" in data
    assert data["vehicle_id"] == "VH-101"
    assert data["timestamp"] == "2026-11-24T14:30:00Z"
    assert data["collision_detected"] is False
    assert "confidence_score" in data
    assert "impact_magnitude" in data
    assert data["severity"] is None
    assert "detection_reason" in data


def test_analyze_high_impact_via_api(client):
    from collision_engine.simulator.generator import IMUScenarioGenerator
    req = IMUScenarioGenerator.get_scenario("high_impact_collision")
    response = client.post("/api/v1/collision/analyze", json=req.model_dump())

    assert response.status_code == 200
    data = response.json()
    assert data["collision_detected"] is True
    assert data["severity"] in ["HIGH", "CRITICAL"]
    assert data["confidence_score"] >= 0.85


def test_simulator_helper_endpoints(client):
    scenarios_resp = client.get("/api/v1/simulator/scenarios")
    assert scenarios_resp.status_code == 200
    scenarios = scenarios_resp.json()
    assert "pothole" in scenarios
    assert "high_impact_collision" in scenarios

    run_resp = client.post("/api/v1/simulator/run/pothole")
    assert run_resp.status_code == 200
    data = run_resp.json()
    assert data["collision_detected"] is False
