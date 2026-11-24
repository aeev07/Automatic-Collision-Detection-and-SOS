"""Seed the database with obviously-fake test patients, vehicle links, and sample accidents.

Run from the repo root:
    python -m backend.database.seed
"""

import json
import sys
from pathlib import Path

# Ensure the repo root is on PYTHONPATH when run as a module
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from datetime import datetime, timezone, timedelta

from backend.database.session import SessionLocal, create_tables
from backend.models.accident import Accident, NotificationStatus
from backend.models.patient import Patient, VehicleLink
from backend.models.notification_log import NotificationLog

FAKE_PATIENTS = [
    {
        "patient_id": "PT-SEED-001",
        "name": "Alice Testington",          # Obviously fake
        "blood_group": "O+",
        "allergies": ["penicillin"],
        "medical_conditions": ["asthma"],
        "emergency_contact": {"name": "Bob Testington", "phone": "+00-555-0001"},
        "vehicle_id": "VH-101",
    },
    {
        "patient_id": "PT-SEED-002",
        "name": "Charlie Dummyson",          # Obviously fake
        "blood_group": "A-",
        "allergies": [],
        "medical_conditions": ["type 2 diabetes"],
        "emergency_contact": {"name": "Diana Dummyson", "phone": "+00-555-0002"},
        "vehicle_id": "VH-202",
    },
]

SAMPLE_ACCIDENTS = [
    {
        "accident_id": "evt-seed-001",
        "vehicle_id": "VH-101",
        "timestamp": datetime(2026, 11, 20, 8, 0, 0, tzinfo=timezone.utc),
        "latitude": 26.8467,
        "longitude": 80.9462,
        "severity": "HIGH",
        "impact_magnitude": 11.2,
        "confidence_score": 0.91,
        "notification_status": NotificationStatus.SENT.value,
        "acknowledged": True,
        "acknowledged_at": datetime(2026, 11, 20, 8, 5, 0, tzinfo=timezone.utc),
        "patient_id": "PT-SEED-001",
    },
    {
        "accident_id": "evt-seed-002",
        "vehicle_id": "VH-202",
        "timestamp": datetime(2026, 11, 21, 12, 30, 0, tzinfo=timezone.utc),
        "latitude": 26.9124,
        "longitude": 80.9876,
        "severity": "CRITICAL",
        "impact_magnitude": 18.5,
        "confidence_score": 0.97,
        "notification_status": NotificationStatus.SENT.value,
        "acknowledged": False,
        "acknowledged_at": None,
        "patient_id": "PT-SEED-002",
    },
    {
        "accident_id": "evt-seed-003",
        "vehicle_id": "VH-303",
        "timestamp": datetime(2026, 11, 22, 7, 15, 0, tzinfo=timezone.utc),
        "latitude": 26.7900,
        "longitude": 80.8900,
        "severity": "MEDIUM",
        "impact_magnitude": 7.3,
        "confidence_score": 0.78,
        "notification_status": NotificationStatus.SENT.value,
        "acknowledged": False,
        "acknowledged_at": None,
        "patient_id": None,
    },
    {
        "accident_id": "evt-seed-004",
        "vehicle_id": "VH-404",
        "timestamp": datetime(2026, 11, 23, 15, 45, 0, tzinfo=timezone.utc),
        "latitude": 26.8500,
        "longitude": 80.9500,
        "severity": "LOW",
        "impact_magnitude": 3.1,
        "confidence_score": 0.62,
        "notification_status": NotificationStatus.FAILED.value,
        "acknowledged": False,
        "acknowledged_at": None,
        "patient_id": None,
    },
    {
        "accident_id": "evt-seed-005",
        "vehicle_id": "VH-101",
        "timestamp": datetime(2026, 11, 24, 6, 0, 0, tzinfo=timezone.utc),
        "latitude": 26.8600,
        "longitude": 80.9600,
        "severity": "HIGH",
        "impact_magnitude": 10.0,
        "confidence_score": 0.88,
        "notification_status": NotificationStatus.PENDING.value,
        "acknowledged": False,
        "acknowledged_at": None,
        "patient_id": "PT-SEED-001",
    },
]

MOCK_HOSPITAL = {
    "name": "MOCK Hospital A (test data)",
    "latitude": 26.8567,
    "longitude": 80.9562,
    "address": "1 Test Street, Simulation City",
    "phone": "+00-000-0000001",
    "distance_km": 1.5,
    "road_distance_km": 2.0,
    "eta_min": 7,
    "source": "mock",
}


def seed():
    create_tables()
    db = SessionLocal()
    try:
        # Patients and vehicle links
        for pd in FAKE_PATIENTS:
            if not db.query(Patient).filter(Patient.patient_id == pd["patient_id"]).first():
                patient = Patient(
                    patient_id=pd["patient_id"],
                    name=pd["name"],
                    blood_group=pd["blood_group"],
                    allergies=json.dumps(pd["allergies"]),
                    medical_conditions=json.dumps(pd["medical_conditions"]),
                    emergency_contact=json.dumps(pd["emergency_contact"]),
                )
                db.add(patient)
            if not db.query(VehicleLink).filter(VehicleLink.vehicle_id == pd["vehicle_id"]).first():
                db.add(VehicleLink(vehicle_id=pd["vehicle_id"], patient_id=pd["patient_id"]))

        # Accidents
        for ad in SAMPLE_ACCIDENTS:
            if not db.query(Accident).filter(Accident.accident_id == ad["accident_id"]).first():
                accident = Accident(
                    selected_hospital=json.dumps(MOCK_HOSPITAL),
                    **ad,
                )
                db.add(accident)
                # Add notification log entries
                db.add(NotificationLog(
                    accident_id=ad["accident_id"],
                    channel="sms",
                    status=ad["notification_status"],
                    message=f"[SEED] SMS for {ad['accident_id']}",
                ))

        db.commit()
        print(f"✓ Seeded {len(FAKE_PATIENTS)} patients and {len(SAMPLE_ACCIDENTS)} accidents.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
