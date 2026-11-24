from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any
from hospital_intelligence.api.schemas import HospitalItem
from hospital_intelligence.routing.osrm import calculate_route_and_eta


class HospitalRanker:
    """
    Calculates routing & ETA in parallel for the nearest candidate facilities,
    and ranks them primarily by shortest ETA, then by distance.
    """

    @classmethod
    def rank_hospitals(
        cls,
        accident_lat: float,
        accident_lon: float,
        raw_hospitals: List[Dict[str, Any]],
        max_results: int = 5
    ) -> List[HospitalItem]:
        # Pre-sort by straight-line Haversine distance so we route the closest candidates
        candidates = sorted(raw_hospitals, key=lambda h: h.get("distance_km", float("inf")))[:max_results]
        if not candidates:
            return []

        def _process_candidate(h: Dict[str, Any]) -> HospitalItem:
            road_dist, eta, route = calculate_route_and_eta(
                start_lat=accident_lat,
                start_lon=accident_lon,
                dest_lat=h["latitude"],
                dest_lon=h["longitude"]
            )
            return HospitalItem(
                name=h["name"],
                latitude=h["latitude"],
                longitude=h["longitude"],
                address=h.get("address"),
                phone=h.get("phone"),
                distance_km=h["distance_km"],
                road_distance_km=road_dist,
                eta_min=eta,
                route=route
            )

        with ThreadPoolExecutor(max_workers=len(candidates)) as executor:
            processed = list(executor.map(_process_candidate, candidates))

        # Sort primarily by shortest ETA, secondarily by road distance
        processed.sort(key=lambda x: (x.eta_min, x.road_distance_km))
        return processed
