import logging
from typing import Tuple, List, Optional
import httpx

from hospital_intelligence.gps.distance import estimate_road_distance_and_eta

logger = logging.getLogger(__name__)

OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving"
OSRM_TABLE_URL = "https://router.project-osrm.org/table/v1/driving"
OSRM_TIMEOUT_SEC = 1.8


def calculate_distance_matrix(
    start_lat: float,
    start_lon: float,
    destinations: List[Tuple[float, float]],
) -> Optional[List[Tuple[float, int]]]:
    """
    Computes actual OpenStreetMap road distance (km) and driving ETA (min) from the
    crash site to ALL candidate hospitals in a single OSRM /table API call.
    Returns None if OSRM is unreachable so the caller can fall back cleanly.
    """
    if not destinations:
        return []

    coord_parts = [f"{start_lon},{start_lat}"] + [f"{lon},{lat}" for lat, lon in destinations]
    coords_str = ";".join(coord_parts)
    url = f"{OSRM_TABLE_URL}/{coords_str}?sources=0&annotations=distance,duration"

    try:
        with httpx.Client(timeout=OSRM_TIMEOUT_SEC) as client:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json()

        distances = data.get("distances", [])
        durations = data.get("durations", [])
        expected_len = len(destinations) + 1

        if (
            not distances
            or not durations
            or len(distances[0]) != expected_len
            or len(durations[0]) != expected_len
        ):
            return None

        results: List[Tuple[float, int]] = []
        for idx, (dist_m, dur_s) in enumerate(zip(distances[0][1:], durations[0][1:])):
            if dist_m is None or dur_s is None:
                dest_lat, dest_lon = destinations[idx]
                road_dist, eta, _ = estimate_road_distance_and_eta(
                    start_lat, start_lon, dest_lat, dest_lon
                )
                results.append((road_dist, eta))
            else:
                road_dist = round(dist_m / 1000.0, 2)
                eta = max(1, round(dur_s / 60.0))
                results.append((road_dist, eta))

        return results

    except Exception as exc:
        logger.warning(f"OSRM table matrix lookup failed ({exc}). Falling back to per-candidate routing.")
        return None


def calculate_route_and_eta(
    start_lat: float, start_lon: float,
    dest_lat: float, dest_lon: float
) -> Tuple[float, int, List[List[float]]]:
    """
    Queries public OSRM server for road distance (km), ETA (minutes), and route coordinates.
    Falls back to geometric Haversine estimation on timeout or network error.
    Note: GeoJSON coordinates are [lon, lat], which are converted to [lat, lon] per CONTRACTS.md.
    """
    url = f"{OSRM_ROUTE_URL}/{start_lon},{start_lat};{dest_lon},{dest_lat}?overview=full&geometries=geojson"

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
