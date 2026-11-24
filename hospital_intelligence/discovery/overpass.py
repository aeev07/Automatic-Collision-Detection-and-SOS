import logging
from typing import List, Dict, Any, Tuple
import httpx

from hospital_intelligence.gps.distance import haversine_distance
from hospital_intelligence.discovery.mock_data import get_mock_hospitals_for_location

logger = logging.getLogger(__name__)

OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"
OVERPASS_TIMEOUT_SEC = 3.5


def fetch_hospitals_overpass(lat: float, lon: float, radius_km: float = 15.0) -> Tuple[List[Dict[str, Any]], str]:
    """
    Attempts to query the OpenStreetMap Overpass API for hospitals within radius_km.
    Falls back gracefully to high-fidelity mock data on timeout or connection error.
    Returns: (hospitals_list, source_string: 'overpass' | 'mock')
    """
    radius_meters = int(radius_km * 1000)
    query = f"""
    [out:json][timeout:3];
    (
      node["amenity"="hospital"](around:{radius_meters},{lat},{lon});
      node["healthcare"="hospital"](around:{radius_meters},{lat},{lon});
    );
    out body 15;
    """

    headers = {
        "User-Agent": "VehicleCollisionEmergencySOS/1.0 (emergency-dispatch-research; contact@emergencysos.org)",
        "Accept": "application/json"
    }

    try:
        with httpx.Client(timeout=OVERPASS_TIMEOUT_SEC, headers=headers) as client:
            resp = client.post(OVERPASS_API_URL, data={"data": query})
            resp.raise_for_status()
            data = resp.json()
            elements = data.get("elements", [])

            hospitals = []
            for el in elements:
                tags = el.get("tags", {})
                name = tags.get("name") or tags.get("name:en") or "Emergency Hospital"
                h_lat = el.get("lat")
                h_lon = el.get("lon")

                if h_lat is None or h_lon is None:
                    continue

                dist = haversine_distance(lat, lon, h_lat, h_lon)
                address = tags.get("addr:street") or tags.get("addr:full") or None
                phone = tags.get("phone") or tags.get("contact:phone") or None

                hospitals.append({
                    "name": name,
                    "latitude": round(h_lat, 5),
                    "longitude": round(h_lon, 5),
                    "address": address,
                    "phone": phone,
                    "distance_km": dist
                })

            if hospitals:
                logger.info(f"Overpass API returned {len(hospitals)} live hospitals.")
                return hospitals, "overpass"

    except Exception as exc:
        logger.warning(f"Overpass query failed ({exc}). Engaging mock data fallback.")

    # Mock data fallback
    mock_hospitals = get_mock_hospitals_for_location(lat, lon, radius_km)
    return mock_hospitals, "mock"
