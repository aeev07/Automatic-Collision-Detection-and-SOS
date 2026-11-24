from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any, Tuple
from hospital_intelligence.api.schemas import HospitalItem
from hospital_intelligence.routing.osrm import calculate_distance_matrix, calculate_route_and_eta


class HospitalRanker:
    """
    Ranks all discovered hospitals by actual OpenStreetMap driving ETA and road distance
    via OSRM /table, then fetches full turn-by-turn street geometry for top candidates.
    Falls back cleanly to straight-line pre-sorting + geometric routing when OSRM is offline.
    """

    @classmethod
    def rank_hospitals(
        cls,
        accident_lat: float,
        accident_lon: float,
        raw_hospitals: List[Dict[str, Any]],
        max_results: int = 5
    ) -> List[HospitalItem]:
        if not raw_hospitals:
            return []

        pool = raw_hospitals[:20]
        destinations = [(h["latitude"], h["longitude"]) for h in pool]
        matrix = calculate_distance_matrix(accident_lat, accident_lon, destinations)

        if matrix is not None:
            # Sort ALL candidates by actual OSM (eta_min, road_distance_km) — not aerial radius
            scored: List[Tuple[int, float, Dict[str, Any]]] = [
                (eta, road_dist, h)
                for h, (road_dist, eta) in zip(pool, matrix)
            ]
            scored.sort(key=lambda item: (item[0], item[1]))
            top_candidates = scored[:max_results]

            def _fetch_geometry(entry: Tuple[int, float, Dict[str, Any]]) -> HospitalItem:
                matrix_eta, matrix_road_dist, h = entry
                road_dist, eta, route = calculate_route_and_eta(
                    start_lat=accident_lat,
                    start_lon=accident_lon,
                    dest_lat=h["latitude"],
                    dest_lon=h["longitude"]
                )
                # Prefer matrix metrics if individual route call fell back to 2-point straight line
                if len(route) <= 2:
                    road_dist, eta = matrix_road_dist, matrix_eta

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

            with ThreadPoolExecutor(max_workers=len(top_candidates)) as executor:
                processed = list(executor.map(_fetch_geometry, top_candidates))
        else:
            # Offline fallback when OSRM Table API is unavailable
            candidates = sorted(pool, key=lambda h: h.get("distance_km", float("inf")))[:max_results]

            def _process_fallback(h: Dict[str, Any]) -> HospitalItem:
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
                processed = list(executor.map(_process_fallback, candidates))

        # Sort primarily by shortest ETA, secondarily by actual road distance
        processed.sort(key=lambda x: (x.eta_min, x.road_distance_km))
        return processed
