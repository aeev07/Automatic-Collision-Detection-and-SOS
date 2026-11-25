from typing import List, Optional
from pydantic import BaseModel, Field


class NearestHospitalsRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, json_schema_extra={"example": 26.8467})
    longitude: float = Field(..., ge=-180.0, le=180.0, json_schema_extra={"example": 80.9462})
    radius_km: Optional[float] = Field(15.0, gt=0, json_schema_extra={"example": 15})


class HospitalItem(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Example Hospital (demo data)"})
    latitude: float = Field(..., json_schema_extra={"example": 26.8703})
    longitude: float = Field(..., json_schema_extra={"example": 80.9174})
    address: Optional[str] = Field(None, json_schema_extra={"example": None})
    phone: Optional[str] = Field(None, json_schema_extra={"example": None})
    distance_km: float = Field(..., description="Straight line Haversine distance in km")
    road_distance_km: float = Field(..., description="Actual road travel distance in km")
    eta_min: int = Field(..., description="Estimated travel time in minutes")
    route: List[List[float]] = Field(default_factory=list, description="List of [latitude, longitude] pairs representing route geometry")


class NearestHospitalsResponse(BaseModel):
    hospitals: List[HospitalItem] = Field(default_factory=list)
    source: str = Field(..., description="'overpass' or 'mock'")
