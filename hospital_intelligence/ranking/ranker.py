from typing import List, Dict, Any
from hospital_intelligence.api.schemas import HospitalItem
from hospital_intelligence.routing.osrm import calculate_route_and_eta


class HospitalRanker:
    """
    Calculates routing & ETA for each discovered facility,
    and ranks them primarily by shortest ETA, then by distance.
    """

    @classmethod
    def rank_hospitals(
        cls,
        accident_lat: float,
        accident_lon: float,
        raw_hospitals: List[Dict[str, Any]],
        max_results: int = 10
    ) -> List[HospitalItem]:
        processed: List[HospitalItem] = []

        for h in raw_hospitals[:max_results]:
            road_dist, eta, route = calculate_route_and_eta(
                start_lat=accident_lat,
                start_lon=accident_lon,
                dest_lat=h["latitude"],
                dest_lon=h["longitude"]
            )

            processed.append(HospitalItem(
                name=h["name"],
                latitude=h["latitude"],
                longitude=h["longitude"],
                address=h.get("address"),
                phone=h.get("phone"),
                distance_km=h["distance_km"],
                road_distance_km=road_dist,
                eta_min=eta,
                route=route
            ))

        # Sort primarily by shortest ETA, secondarily by road distance
        processed.sort(key=lambda x: (x.eta_min, x.road_distance_km))
        return processed
