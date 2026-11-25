from typing import List, Dict, Any
from hospital_intelligence.gps.distance import haversine_distance

# High-fidelity emergency hospitals around Lucknow reference center (26.8467, 80.9462)
MOCK_HOSPITALS_DATABASE: List[Dict[str, Any]] = [
    {
        "name": "Civil Hospital Hazratganj (demo data)",
        "latitude": 26.8510,
        "longitude": 80.9450,
        "address": None,
        "phone": None
    },
    {
        "name": "King George's Medical University (Trauma Centre) (demo data)",
        "latitude": 26.8703,
        "longitude": 80.9174,
        "address": None,
        "phone": None
    },
    {
        "name": "Sanjay Gandhi Postgraduate Institute of Medical Sciences (SGPGI) (demo data)",
        "latitude": 26.7441,
        "longitude": 80.9392,
        "address": None,
        "phone": None
    },
    {
        "name": "Dr. Ram Manohar Lohia Institute of Medical Sciences (demo data)",
        "latitude": 26.8647,
        "longitude": 80.9995,
        "address": None,
        "phone": None
    },
    {
        "name": "Apollomedics Super Speciality Hospital (demo data)",
        "latitude": 26.7824,
        "longitude": 80.9021,
        "address": None,
        "phone": None
    },
    {
        "name": "Sahara Hospital (demo data)",
        "latitude": 26.8522,
        "longitude": 81.0041,
        "address": None,
        "phone": None
    },
    {
        "name": "Medanta Hospital Lucknow (demo data)",
        "latitude": 26.7761,
        "longitude": 80.9782,
        "address": None,
        "phone": None
    }
]


def get_mock_hospitals_for_location(lat: float, lon: float, radius_km: float = 15.0) -> List[Dict[str, Any]]:
    """
    Returns mock hospitals filtered within radius_km, auto-expanding up to 30km
    if the requested radius yields zero facilities.
    If the requested coordinates are far from Lucknow, generates dynamically positioned
    emergency facilities relative to the given coordinates so that demos anywhere succeed.
    """
    search_radii = [radius_km] if radius_km >= 30.0 else [radius_km, 30.0]

    for active_radius in search_radii:
        results = []
        for h in MOCK_HOSPITALS_DATABASE:
            dist = haversine_distance(lat, lon, h["latitude"], h["longitude"])
            if dist <= active_radius:
                results.append({
                    "name": h["name"],
                    "latitude": h["latitude"],
                    "longitude": h["longitude"],
                    "address": h["address"],
                    "phone": h["phone"],
                    "distance_km": dist
                })
        if results:
            return results

    # Dynamic fallback if query location is far away (e.g. testing in Delhi, Mumbai, or internationally)
        
        # No known demo hospitals near this location: return nothing rather than invent facilities.
    return []
