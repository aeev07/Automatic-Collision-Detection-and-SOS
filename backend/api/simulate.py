"""Simulate route: POST /api/v1/simulate/analyze.

Forwards sensor readings to the collision_engine, and if a collision is detected,
calls the same create_event service function used by POST /api/v1/events.
If the collision service is down, returns 502 with a clear message.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.integrations.collision_client import CollisionServiceUnavailable, analyze_collision
from backend.schemas.accident import AccidentCreate, AccidentOut
from backend.schemas.collision import CollisionAnalyzeRequest
from backend.services import event_service
from backend.api.events import _accident_to_out

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/simulate", tags=["simulate"])


@router.post("/analyze", response_model=AccidentOut, status_code=status.HTTP_200_OK)
def simulate_analyze(
    payload: CollisionAnalyzeRequest,
    db: Session = Depends(get_db),
):
    """Forward sensor data to the collision_engine and, if a collision is detected,
    create an event (including hospital dispatch and notifications).

    Returns the Accident if a collision was detected, or 200 with a no-collision body
    if the engine did not flag a collision.

    Returns 502 if the collision service is unreachable.
    """
    if payload.latitude is None or payload.longitude is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="latitude and longitude are required for simulate/analyze",
        )

    # Build the payload to send to the collision engine (without location fields)
    collision_payload = {
        "vehicle_id": payload.vehicle_id,
        "timestamp": payload.timestamp.isoformat(),
        "readings": [r.model_dump() for r in payload.readings],
    }

    try:
        result = analyze_collision(collision_payload)
    except CollisionServiceUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Collision service unavailable: {exc}",
        )

    if not result.get("collision_detected", False):
        # No collision — return a lightweight 200 response (no event created)
        raise HTTPException(
            status_code=status.HTTP_200_OK,
            detail="No collision detected by the collision engine",
        )

    # Collision detected — create event via the same service function
    event_payload = AccidentCreate(
        event_id=result["event_id"],
        vehicle_id=result["vehicle_id"],
        timestamp=result["timestamp"],
        collision_detected=True,
        confidence_score=result.get("confidence_score"),
        impact_magnitude=result.get("impact_magnitude"),
        severity=result.get("severity"),
        detection_reason=result.get("detection_reason"),
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    accident = event_service.create_event(event_payload, db)
    return _accident_to_out(accident)
