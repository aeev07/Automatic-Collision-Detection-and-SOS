"""Client for the hospital_intelligence service.

Calls POST :8002/api/v1/location/nearest-hospitals.
On ANY failure (connection error, timeout, non-200, empty list) falls back to
backend.integrations.mock_hospitals.get_mock_hospitals().
"""

import logging
from typing import Any, Dict, Optional

import httpx

from backend.config import get_settings
from backend.integrations.mock_hospitals import get_mock_hospitals

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 5.0


def find_nearest_hospital(latitude: float, longitude: float) -> Dict[str, Any]:
    """Return the nearest hospital dict.

    Tries the live hospital_intelligence service first; falls back to mock data on
    any error so that the backend never crashes due to an unavailable dependency.
    """
    settings = get_settings()
    url = f"{settings.HOSPITAL_SERVICE_URL}/api/v1/location/nearest-hospitals"
    payload = {"latitude": latitude, "longitude": longitude, "radius_km": 15}

    try:
        with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            hospitals: list = data.get("hospitals", [])
            if not hospitals:
                raise ValueError("Hospital service returned empty list")
            # Sort by distance and pick the nearest
            hospitals.sort(key=lambda h: h.get("distance_km") or float("inf"))
            nearest = hospitals[0]
            nearest["source"] = data.get("source", "overpass")
            logger.info("Hospital fetched from live service: %s", nearest.get("name"))
            return nearest

    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Hospital service unavailable (%s). Using mock fallback.", exc
        )
        mocks = get_mock_hospitals(latitude, longitude)
        return mocks[0]  # already sorted nearest-first
