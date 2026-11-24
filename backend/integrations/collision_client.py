"""Client for the collision_engine service.

Calls POST :8001/api/v1/collision/analyze.
If the service is unreachable, raises CollisionServiceUnavailable so the route
can return 502 with a clear message (the route must NOT swallow the error silently).
"""

import logging
from typing import Any, Dict

import httpx

from backend.config import get_settings

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 10.0


class CollisionServiceUnavailable(Exception):
    """Raised when the collision engine cannot be reached or returns an error."""


def analyze_collision(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Forward a sensor payload to the collision_engine and return the analysis result.

    Args:
        payload: Dict matching the collision_engine POST /api/v1/collision/analyze body.

    Returns:
        Parsed JSON response dict from the collision engine.

    Raises:
        CollisionServiceUnavailable: on any network or HTTP error.
    """
    settings = get_settings()
    url = f"{settings.COLLISION_SERVICE_URL}/api/v1/collision/analyze"

    try:
        with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as exc:
        raise CollisionServiceUnavailable(
            f"Collision service returned HTTP {exc.response.status_code}: {exc.response.text}"
        ) from exc
    except httpx.RequestError as exc:
        raise CollisionServiceUnavailable(
            f"Collision service unreachable: {exc}"
        ) from exc
