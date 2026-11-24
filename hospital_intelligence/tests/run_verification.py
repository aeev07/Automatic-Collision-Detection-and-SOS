import sys
from pathlib import Path
import json

# Ensure repository root is in sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from hospital_intelligence.discovery.overpass import fetch_hospitals_overpass
from hospital_intelligence.ranking.ranker import HospitalRanker


def run_hospital_verification():
    # Test coordinates: Hazratganj / Lucknow Center
    lat, lon = 26.8467, 80.9462
    radius = 15.0

    print("\n" + "=" * 90)
    print(f"HOSPITAL INTELLIGENCE VERIFICATION — ACCIDENT LOCATION: ({lat}, {lon}) RADIUS: {radius}km")
    print("=" * 90)

    # 1. Fetch hospitals (Overpass or fallback)
    raw_hospitals, source = fetch_hospitals_overpass(lat, lon, radius)
    print(f"Discovered {len(raw_hospitals)} hospitals (Source: {source.upper()})")

    # 2. Compute Routing & Ranking
    ranked = HospitalRanker.rank_hospitals(lat, lon, raw_hospitals)

    header = f"{'RANK':<5} | {'HOSPITAL NAME':<40} | {'DIST (km)':<10} | {'ROAD (km)':<10} | {'ETA (min)':<9}"
    print("\n" + "-" * len(header))
    print(header)
    print("-" * len(header))

    for idx, h in enumerate(ranked, 1):
        print(f"{idx:<5} | {h.name[:38]:<40} | {h.distance_km:<10.1f} | {h.road_distance_km:<10.1f} | {h.eta_min:<9}")

    print("-" * len(header))

    if ranked:
        nearest = ranked[0]
        print(f"\n[NEAREST DISPATCH TARGET: {nearest.name}]")
        print(f"Address: {nearest.address}")
        print(f"Emergency Phone: {nearest.phone}")
        print(f"ETA: {nearest.eta_min} minutes ({nearest.road_distance_km} km via road)")
        print(f"First 3 Route Waypoints: {nearest.route[:3]}")
        print("\nFull Contract Response JSON for Nearest Target:")
        print(json.dumps(nearest.model_dump(), indent=2))

    print("\n" + "=" * 90)


if __name__ == "__main__":
    run_hospital_verification()
