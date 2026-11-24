"""Pydantic schemas for the hospital object (from CONTRACTS.md section 2)."""

from typing import List, Optional
from pydantic import BaseModel


class HospitalOut(BaseModel):
    """Represents a single hospital entry returned by the hospital_intelligence service."""

    name: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    phone: Optional[str] = None
    distance_km: Optional[float] = None
    road_distance_km: Optional[float] = None
    eta_min: Optional[int] = None
    route: Optional[List[List[float]]] = None
    source: Optional[str] = None  # "overpass" | "mock"

    model_config = {"from_attributes": True}
