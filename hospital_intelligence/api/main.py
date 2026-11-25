from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from hospital_intelligence.api.schemas import (
    NearestHospitalsRequest,
    NearestHospitalsResponse,
)
from hospital_intelligence.discovery.overpass import fetch_hospitals_overpass
from hospital_intelligence.ranking.ranker import HospitalRanker

app = FastAPI(
    title="Hospital Intelligence & Routing API",
    description="Emergency hospital discovery via OpenStreetMap Overpass and OSRM routing with mock fallback.",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check() -> Dict[str, str]:
    return {"status": "healthy", "service": "hospital_intelligence", "port": "8002"}


@app.post(
    "/api/v1/location/nearest-hospitals",
    response_model=NearestHospitalsResponse,
    status_code=status.HTTP_200_OK,
    tags=["Hospital Finder"]
)
def find_nearest_hospitals(payload: NearestHospitalsRequest) -> NearestHospitalsResponse:
    """
    Finds nearest hospitals within radius_km:
    1. Queries live OpenStreetMap Overpass API (with automatic fallback to curated mock data).
    2. Calculates actual road distance and ETA using OSRM (with geometric Haversine fallback).
    3. Ranks hospitals by shortest ETA and distance.
    """
    radius = payload.radius_km or 15.0

    # 1. Discover facilities (live or fallback)
    raw_hospitals, source = fetch_hospitals_overpass(
        lat=payload.latitude,
        lon=payload.longitude,
        radius_km=radius
    )

    if not raw_hospitals:
        return NearestHospitalsResponse(hospitals=[], source=source)

    # 2. Compute routing, ETA, and rank
    ranked_hospitals = HospitalRanker.rank_hospitals(
        accident_lat=payload.latitude,
        accident_lon=payload.longitude,
        raw_hospitals=raw_hospitals
    )

    return NearestHospitalsResponse(
        hospitals=ranked_hospitals,
        source=source
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("hospital_intelligence.api.main:app", host="0.0.0.0", port=8002, reload=True)
