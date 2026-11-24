"""Demo script: exercises the ACDS backend end-to-end.

Works even when collision_engine and hospital_intelligence services are down
(the backend falls back to mock hospitals and simulates directly via POST /events).

Usage (from repo root, with backend running on :8000):
    python demo.py
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

import httpx

# ── Config ────────────────────────────────────────────────────────────────────
BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
ADMIN_KEY = os.getenv("API_KEY_ADMIN", "dev-admin-key")
HOSPITAL_KEY = os.getenv("API_KEY_HOSPITAL", "dev-hospital-key")

ADMIN_HEADERS = {"X-API-Key": ADMIN_KEY}
HOSPITAL_HEADERS = {"X-API-Key": HOSPITAL_KEY}

EVENT_ID = "demo-evt-001"


def pp(label: str, resp: httpx.Response):
    print(f"\n{'='*60}")
    print(f"{label}  [{resp.status_code}]")
    try:
        print(json.dumps(resp.json(), indent=2))
    except Exception:
        print(resp.text)


def main():
    print(f"ACDS Backend Demo — targeting {BASE_URL}")

    with httpx.Client(base_url=BASE_URL, timeout=15) as client:
        # 1. Health check
        r = client.get("/health")
        pp("GET /health", r)
        assert r.status_code == 200, "Health check failed — is the server running?"

        # 2. POST /api/v1/events (creates event; hospital service may be mocked)
        payload = {
            "event_id": EVENT_ID,
            "vehicle_id": "VH-DEMO-01",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "collision_detected": True,
            "confidence_score": 0.95,
            "impact_magnitude": 12.5,
            "severity": "HIGH",
            "detection_reason": "Demo collision",
            "latitude": 26.8467,
            "longitude": 80.9462,
        }
        r = client.post("/api/v1/events", json=payload, headers=HOSPITAL_HEADERS)
        pp("POST /api/v1/events", r)
        assert r.status_code == 200

        # 3. Duplicate — should return existing (200, not create new)
        r2 = client.post("/api/v1/events", json=payload, headers=HOSPITAL_HEADERS)
        pp("POST /api/v1/events (duplicate)", r2)
        assert r2.status_code == 200

        # 4. GET /api/v1/events (list)
        r = client.get("/api/v1/events", headers=HOSPITAL_HEADERS)
        pp("GET /api/v1/events", r)

        # 5. GET /api/v1/events/{id}
        r = client.get(f"/api/v1/events/{EVENT_ID}", headers=HOSPITAL_HEADERS)
        pp(f"GET /api/v1/events/{EVENT_ID}", r)

        # 6. Acknowledge
        r = client.post(f"/api/v1/events/{EVENT_ID}/acknowledge", headers=HOSPITAL_HEADERS)
        pp(f"POST /api/v1/events/{EVENT_ID}/acknowledge", r)
        assert r.json()["acknowledged"] is True

        # 7. Create a patient (admin)
        patient_payload = {
            "patient_id": "PT-DEMO-001",
            "name": "Demo Patient (test data)",
            "blood_group": "B+",
            "allergies": ["ibuprofen"],
            "medical_conditions": [],
            "emergency_contact": {"name": "Demo Contact", "phone": "+00-555-9999"},
            "vehicle_id": "VH-DEMO-01",
        }
        r = client.post("/api/v1/patients", json=patient_payload, headers=ADMIN_HEADERS)
        pp("POST /api/v1/patients (admin)", r)

        # 8. Get patient (hospital key)
        r = client.get("/api/v1/patients/PT-DEMO-001", headers=HOSPITAL_HEADERS)
        pp("GET /api/v1/patients/PT-DEMO-001", r)

        print("\n✅ Demo completed successfully.")


if __name__ == "__main__":
    main()
