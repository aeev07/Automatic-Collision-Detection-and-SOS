import pytest
from fastapi.testclient import TestClient
from hospital_intelligence.api.main import app
from hospital_intelligence.gps.distance import haversine_distance, estimate_road_distance_and_eta
from hospital_intelligence.discovery.mock_data import get_mock_hospitals_for_location
from hospital_intelligence.discovery.overpass import fetch_hospitals_overpass
from hospital_intelligence.routing.osrm import calculate_route_and_eta


@pytest.fixture
def client():
    return TestClient(app)


def test_haversine_distance_calculation():
    # Distance between Lucknow center (26.8467, 80.9462) and KGMU (26.8703, 80.9174) ~3.9km
    dist = haversine_distance(26.8467, 80.9462, 26.8703, 80.9174)
    assert 3.5 <= dist <= 4.5


def test_geometric_fallback_routing():
    road_dist, eta, route = estimate_road_distance_and_eta(26.8467, 80.9462, 26.8703, 80.9174)
    assert road_dist > 3.5
    assert eta >= 1
    assert len(route) == 2
    assert route[0] == [26.8467, 80.9462]


def test_mock_hospitals_fallback_data():
    hospitals = get_mock_hospitals_for_location(26.8467, 80.9462, radius_km=15.0)
    assert len(hospitals) >= 3
    # Check required fields
    for h in hospitals:
        assert "name" in h
        assert "latitude" in h
        assert "longitude" in h
        assert "distance_km" in h


def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "hospital_intelligence"
    assert data["port"] == "8002"


def test_nearest_hospitals_contract_sample(client):
    """
    Test exact request from docs/CONTRACTS.md:
    Request: {"latitude": 26.8467, "longitude": 80.9462, "radius_km": 15}
    """
    payload = {
        "latitude": 26.8467,
        "longitude": 80.9462,
        "radius_km": 15
    }
    response = client.post("/api/v1/location/nearest-hospitals", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Validate top-level contract
    assert "hospitals" in data
    assert "source" in data
    assert data["source"] in ["overpass", "mock"]
    assert len(data["hospitals"]) > 0

    # Validate first hospital shape
    first = data["hospitals"][0]
    assert "name" in first
    assert "latitude" in first
    assert "longitude" in first
    assert "address" in first
    assert "phone" in first
    assert "distance_km" in first
    assert "road_distance_km" in first
    assert "eta_min" in first
    assert "route" in first

    # Route format: list of [lat, lng] pairs
    if first["route"]:
        assert len(first["route"][0]) == 2
        # Verify latitude coordinate order
        assert -90.0 <= first["route"][0][0] <= 90.0


def test_nearest_hospitals_sorted_by_eta(client):
    payload = {"latitude": 26.8467, "longitude": 80.9462, "radius_km": 15}
    response = client.post("/api/v1/location/nearest-hospitals", json=payload)
    assert response.status_code == 200
    hospitals = response.json()["hospitals"]

    etas = [h["eta_min"] for h in hospitals]
    assert etas == sorted(etas), "Hospitals must be sorted by ETA ascending"
