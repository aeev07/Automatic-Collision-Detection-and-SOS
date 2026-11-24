import math
from typing import Tuple, List

EARTH_RADIUS_KM = 6371.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two GPS coordinates in kilometers.
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(EARTH_RADIUS_KM * c, 2)


def estimate_road_distance_and_eta(lat1: float, lon1: float, lat2: float, lon2: float) -> Tuple[float, int, List[List[float]]]:
    """
    Geometric fallback when OSRM routing service is unreachable:
    - Road distance: Haversine distance multiplied by urban detour winding factor (1.25)
    - ETA: Assumes emergency ambulance transit speed of 35 km/h
    - Route: Straight line waypoint pair [[lat1, lon1], [lat2, lon2]]
    """
    air_dist = haversine_distance(lat1, lon1, lat2, lon2)
    road_dist = round(max(0.1, air_dist * 1.25), 2)
    
    # 35 km/h urban emergency response transit speed
    eta_min = max(1, round((road_dist / 35.0) * 60))
    route = [[round(lat1, 5), round(lon1, 5)], [round(lat2, 5), round(lon2, 5)]]
    
    return road_dist, eta_min, route
