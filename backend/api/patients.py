"""Patient routes: POST /api/v1/patients (admin), GET /api/v1/patients/{patient_id}.

Kept in backend/api/patients.py so a teammate can extend or replace this file
without touching any other backend module.
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.api.auth import require_admin, require_hospital_or_admin
from backend.database.session import get_db
from backend.models.patient import Patient, VehicleLink
from backend.schemas.patient import PatientCreate, PatientOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/patients", tags=["patients"])


def _patient_to_out(p: Patient) -> PatientOut:
    return PatientOut(
        patient_id=p.patient_id,
        name=p.name,
        blood_group=p.blood_group,
        allergies=json.loads(p.allergies) if isinstance(p.allergies, str) else p.allergies,
        medical_conditions=(
            json.loads(p.medical_conditions)
            if isinstance(p.medical_conditions, str)
            else p.medical_conditions
        ),
        emergency_contact=(
            json.loads(p.emergency_contact)
            if isinstance(p.emergency_contact, str)
            else p.emergency_contact
        ),
    )


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    _role: str = Depends(require_admin),
):
    """Create a new patient record (admin key required)."""
    existing = db.query(Patient).filter(Patient.patient_id == payload.patient_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Patient '{payload.patient_id}' already exists",
        )
    patient = Patient(
        patient_id=payload.patient_id,
        name=payload.name,
        blood_group=payload.blood_group,
        allergies=json.dumps(payload.allergies),
        medical_conditions=json.dumps(payload.medical_conditions),
        emergency_contact=(
            json.dumps(payload.emergency_contact.model_dump())
            if payload.emergency_contact
            else json.dumps({})
        ),
    )
    db.add(patient)
    if payload.vehicle_id:
        link = VehicleLink(vehicle_id=payload.vehicle_id, patient_id=payload.patient_id)
        db.add(link)
    db.commit()
    db.refresh(patient)
    return _patient_to_out(patient)


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    _role: str = Depends(require_hospital_or_admin),
):
    """Fetch patient by id (hospital or admin key required)."""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found")
    return _patient_to_out(patient)
