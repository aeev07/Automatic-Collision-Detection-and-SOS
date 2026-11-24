from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List

from collision_engine.api.schemas import (
    CollisionAnalysisRequest,
    CollisionAnalysisResponse,
)
from collision_engine.detection.detector import MultiStageCollisionDetector
from collision_engine.classification.classifier import CollisionClassifier
from collision_engine.simulator.generator import IMUScenarioGenerator

app = FastAPI(
    title="Vehicle Collision Engine API",
    description="Multi-stage IMU collision analysis, temporal persistence filtering, and severity classification.",
    version="1.0.0"
)

# CORS middleware for local frontend/backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = MultiStageCollisionDetector()


@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check() -> Dict[str, str]:
    return {"status": "healthy", "service": "collision_engine", "port": "8001"}


@app.post(
    "/api/v1/collision/analyze",
    response_model=CollisionAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Collision Detection"]
)
def analyze_collision(payload: CollisionAnalysisRequest) -> CollisionAnalysisResponse:
    """
    Analyzes raw IMU timeseries data using multi-stage detection:
    1. Instantaneous peak threshold trigger
    2. Temporal persistence verification (eliminates potholes <20ms)
    3. Gyroscope angular rate correlation (eliminates pure braking)
    4. Delta-V & Rollover analysis
    """
    if not payload.readings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="IMU readings list cannot be empty"
        )

    metrics = detector.analyze(payload.readings)
    result = CollisionClassifier.classify(
        metrics=metrics,
        vehicle_id=payload.vehicle_id,
        timestamp=payload.timestamp
    )
    return result


# --- Convenience Endpoints for Simulator & Demo Testing ---

@app.get("/api/v1/simulator/scenarios", tags=["Simulator"])
def list_scenarios() -> List[str]:
    """Returns available simulation scenario names."""
    return [
        "normal_driving",
        "hard_braking",
        "pothole",
        "minor_bump",
        "high_impact_collision",
        "rollover"
    ]


@app.post("/api/v1/simulator/run/{scenario_name}", response_model=CollisionAnalysisResponse, tags=["Simulator"])
def run_simulation(scenario_name: str, vehicle_id: str = "VH-101") -> CollisionAnalysisResponse:
    """Generates synthetic IMU readings for a scenario and analyzes them immediately."""
    try:
        req = IMUScenarioGenerator.get_scenario(scenario_name=scenario_name, vehicle_id=vehicle_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    return analyze_collision(req)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("collision_engine.api.main:app", host="0.0.0.0", port=8001, reload=True)
