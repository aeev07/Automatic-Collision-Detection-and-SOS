"""Mock hospital list used as a fallback when the hospital_intelligence service is unavailable.

Names follow the convention "MOCK Hospital X (test data)" to make it obvious these are
not real medical facilities.
"""

from typing import List, Dict, Any


def get_mock_hospitals(latitude: float, longitude: float) -> List[Dict[str, Any]]:
    """Return a small list of clearly-labelled mock hospitals near the given coordinates.

    Coordinates are offset slightly from the accident location so they look plausible
    without matching any real facility.
    """
    return [
        {
            "name": "MOCK Hospital A (test data)",
            "latitude": latitude + 0.01,
            "longitude": longitude + 0.01,
            "address": "1 Test Street, Simulation City",
            "phone": "+00-000-0000001",
            "distance_km": 1.5,
            "road_distance_km": 2.0,
            "eta_min": 7,
            "route": [[latitude, longitude], [latitude + 0.01, longitude + 0.01]],
            "source": "mock",
        },
        {
            "name": "MOCK Hospital B (test data)",
            "latitude": latitude + 0.02,
            "longitude": longitude - 0.01,
            "address": "2 Dummy Avenue, Simulation City",
            "phone": "+00-000-0000002",
            "distance_km": 2.8,
            "road_distance_km": 3.5,
            "eta_min": 12,
            "route": [[latitude, longitude], [latitude + 0.02, longitude - 0.01]],
            "source": "mock",
        },
    ]
