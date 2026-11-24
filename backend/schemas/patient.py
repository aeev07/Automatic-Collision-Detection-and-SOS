"""Pydantic schemas for Patient (CONTRACTS.md section 4)."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class EmergencyContact(BaseModel):
    name: str
    phone: str


class PatientCreate(BaseModel):
    """Body for POST /api/v1/patients (admin key required)."""

    patient_id: str
    name: str
    blood_group: Optional[str] = None
    allergies: List[str] = []
    medical_conditions: List[str] = []
    emergency_contact: Optional[EmergencyContact] = None
    vehicle_id: Optional[str] = None  # optional: also create a VehicleLink


class PatientOut(BaseModel):
    """Patient object returned to authorised clients."""

    patient_id: str
    name: str
    blood_group: Optional[str] = None
    allergies: List[str] = []
    medical_conditions: List[str] = []
    emergency_contact: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}
