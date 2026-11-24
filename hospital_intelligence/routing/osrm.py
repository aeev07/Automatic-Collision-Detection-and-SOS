import logging
from typing import Tuple, List, Dict, Any
import httpx

from hospital_intelligence.gps.distance import estimate_road_distance_and_eta

logger = logging.getLogger(__name__)

OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving"
OSRM_TIMEOUT_SEC = 2.5


def calculate_route_and_eta(
    start_lat: float, start_lon: float,
    dest_lat: float, dest_lon: float
) -> Tuple[float, int, List[List[float]]]:
    """
    Queries public OSRM server for road distance (km), ETA (minutes), and route coordinates.
    Falls back to geometric Haversine estimation on timeout or network error.
    Note: GeoJSON coordinates are [lon, lat], which are converted to [lat, lon] per CONTRACTS.md.
    """
    url = f"{OSRM_ROUTE_URL}/{start_lon},{start_lat};{dest_lon},{dest_lat}?overview=simplified&geometries=geojson"

    try:
        with httpx.Client(timeout=OSRM_TIMEOUT_SEC) as client:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json()
            routes = data.get("routes", [])

            if routes:
                route_obj = routes[0]
                road_dist_km = round(route_obj.get("distance", 0.0) / 1000.0, 2)
                eta_minutes = max(1, round(route_obj.get("duration", 0.0) / 60.0))
                
                # Convert GeoJSON [lon, lat] pairs to [lat, lon] pairs for CONTRACTS.md
                geometry = route_obj.get("geometry", {}).get("coordinates", [])
                formatted_route = [[round(pt[1], 5), round(pt[0], 5)] for pt in geometry]
                
                if not formatted_route:
                    formatted_route = [[start_lat, start_lon], [dest_lat, dest_lon]]

                return road_dist_km, eta_minutes, formatted_route

    except Exception as exc:
        logger.warning(f"OSRM route lookup failed ({exc}). Using geometric fallback.")

    # Geometric fallback
    return estimate_road_distance_and_eta(start_lat, start_lon, dest_lat, dest_lon)
