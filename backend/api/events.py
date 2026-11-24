"""Event routes: POST /api/v1/events, GET /api/v1/events, GET /{id}, POST /{id}/acknowledge."""

import json
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.api.auth import require_hospital_or_admin
from backend.database.session import get_db
from backend.schemas.accident import AccidentCreate, AccidentOut
from backend.services import event_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/events", tags=["events"])


def _accident_to_out(accident) -> AccidentOut:
    """Convert ORM Accident to AccidentOut, deserialising the JSON hospital field."""
    data = {c.name: getattr(accident, c.name) for c in accident.__table__.columns}
    if isinstance(data.get("selected_hospital"), str):
        try:
            data["selected_hospital"] = json.loads(data["selected_hospital"])
        except (json.JSONDecodeError, TypeError):
            data["selected_hospital"] = None
    return AccidentOut(**data)


@router.post("", response_model=AccidentOut, status_code=status.HTTP_200_OK)
def create_event(
    payload: AccidentCreate,
    db: Session = Depends(get_db),
    _role: str = Depends(require_hospital_or_admin),
):
    """Create a collision event. Duplicate event_id returns the existing record (HTTP 200)."""
    accident = event_service.create_event(payload, db)
    return _accident_to_out(accident)


@router.get("", response_model=List[AccidentOut])
def list_events(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None, alias="status"),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _role: str = Depends(require_hospital_or_admin),
):
    """List all events, newest first. Filter by severity, notification status, or id substring."""
    accidents = event_service.list_events(db, severity=severity, status=status, q=q)
    return [_accident_to_out(a) for a in accidents]


@router.get("/{event_id}", response_model=AccidentOut)
def get_event(
    event_id: str,
    db: Session = Depends(get_db),
    _role: str = Depends(require_hospital_or_admin),
):
    """Fetch a single event by id."""
    accident = event_service.get_event(event_id, db)
    if accident is None:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found")
    return _accident_to_out(accident)


@router.post("/{event_id}/acknowledge", response_model=AccidentOut)
def acknowledge_event(
    event_id: str,
    db: Session = Depends(get_db),
    _role: str = Depends(require_hospital_or_admin),
):
    """Acknowledge a collision event. Idempotent; does not change notification_status."""
    try:
        accident = event_service.acknowledge_event(event_id, db)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found")
    return _accident_to_out(accident)
