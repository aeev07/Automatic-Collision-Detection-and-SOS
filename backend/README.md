# ACDS Backend — Setup & Developer Guide

## Overview

Python/FastAPI backend for the **Automated Vehicle Collision Detection & Direct Emergency Hospital Dispatch System**.

| Responsibility | Module |
|---|---|
| Event ingestion & deduplication | `backend/services/event_service.py` |
| Hospital lookup (live + mock fallback) | `backend/integrations/hospital_client.py` |
| Notifications (mocked SMS + voice) | `backend/notifications/dispatcher.py` |
| Auth (X-API-Key, roles) | `backend/api/auth.py` |
| Configuration | `backend/config.py` + `backend/.env` |

---

## Quick Start

```bash
# From the repo root (ACDS/)
# 1. Activate your virtual environment
source .venv/bin/activate        # Linux/macOS
.venv\Scripts\activate           # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and edit env file
cp backend/.env.example backend/.env

# 4. Start the server
uvicorn backend.api.main:app --port 8000 --reload
```

## Environment Variables (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./vehicle_emergency.db` | SQLAlchemy DB URL. Change to Postgres by swapping the URL — no code changes needed |
| `HOSPITAL_SERVICE_URL` | `http://localhost:8002` | Hospital intelligence service |
| `COLLISION_SERVICE_URL` | `http://localhost:8001` | Collision engine service |
| `API_KEY_HOSPITAL` | `dev-hospital-key` | Hospital read/acknowledge key |
| `API_KEY_ADMIN` | `dev-admin-key` | Admin key (all permissions) |
| `MOCK_NOTIFICATIONS` | `true` | Never send real Twilio alerts when `true` |
| `TWILIO_ACCOUNT_SID` | _(blank)_ | Future Twilio integration |
| `TWILIO_AUTH_TOKEN` | _(blank)_ | Future Twilio integration |
| `TWILIO_PHONE_NUMBER` | _(blank)_ | Future Twilio integration |

---

## Running Tests

```bash
# From ACDS/ root
pytest backend/tests/ -v
```

Tests use an **in-memory SQLite** DB and **mocked httpx** — no live services or network needed.

---

## Seeding the Database

```bash
python -m backend.database.seed
```

Inserts 2 fake patients, their vehicle links, and 5 sample accidents with mixed severities/statuses.

---

## Running the Demo

Requires the backend to be running (`uvicorn backend.api.main:app --port 8000`):

```bash
python demo.py
```

Demonstrates: health check → create event → duplicate prevention → list → get by id → acknowledge → create patient → fetch patient.  Works with both services down (hospital falls back to mock data, event is created via POST /events directly).

---

## Endpoint Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Liveness probe |
| POST | `/api/v1/events` | hospital/admin | Create collision event |
| GET | `/api/v1/events` | hospital/admin | List events (filters: `severity`, `status`, `q`) |
| GET | `/api/v1/events/{event_id}` | hospital/admin | Get single event |
| POST | `/api/v1/events/{event_id}/acknowledge` | hospital/admin | Acknowledge event |
| POST | `/api/v1/simulate/analyze` | None | Forward sensor data to collision engine and auto-create event |
| POST | `/api/v1/patients` | admin only | Create patient record |
| GET | `/api/v1/patients/{patient_id}` | hospital/admin | Get patient by id |

### Example `curl` Commands

```bash
# Health
curl http://localhost:8000/health

# Create event (hospital key)
curl -X POST http://localhost:8000/api/v1/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-hospital-key" \
  -d '{
    "event_id": "evt-001",
    "vehicle_id": "VH-101",
    "timestamp": "2026-11-24T10:00:00Z",
    "collision_detected": true,
    "confidence_score": 0.91,
    "impact_magnitude": 11.2,
    "severity": "HIGH",
    "latitude": 26.8467,
    "longitude": 80.9462
  }'

# List events
curl -H "X-API-Key: dev-hospital-key" "http://localhost:8000/api/v1/events?severity=HIGH"

# Get event by id
curl -H "X-API-Key: dev-hospital-key" http://localhost:8000/api/v1/events/evt-001

# Acknowledge
curl -X POST -H "X-API-Key: dev-hospital-key" http://localhost:8000/api/v1/events/evt-001/acknowledge

# Create patient (admin only)
curl -X POST http://localhost:8000/api/v1/patients \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-admin-key" \
  -d '{
    "patient_id": "PT-001",
    "name": "Alice Testington",
    "blood_group": "O+",
    "allergies": ["penicillin"],
    "medical_conditions": ["asthma"],
    "emergency_contact": {"name": "Bob Testington", "phone": "+00-555-0001"},
    "vehicle_id": "VH-101"
  }'

# Get patient (hospital key)
curl -H "X-API-Key: dev-hospital-key" http://localhost:8000/api/v1/patients/PT-001
```

### Example JSON Response (Accident)

```json
{
  "accident_id": "evt-001",
  "vehicle_id": "VH-101",
  "timestamp": "2026-11-24T10:00:00Z",
  "latitude": 26.8467,
  "longitude": 80.9462,
  "severity": "HIGH",
  "impact_magnitude": 11.2,
  "confidence_score": 0.91,
  "selected_hospital": {
    "name": "MOCK Hospital A (test data)",
    "latitude": 26.8567,
    "longitude": 80.9562,
    "distance_km": 1.5,
    "source": "mock"
  },
  "notification_status": "SENT",
  "acknowledged": false,
  "acknowledged_at": null,
  "patient_id": null,
  "created_at": "2026-11-24T10:00:01Z"
}
```

---

## Architecture Notes

- **Duplicate prevention**: enforced both at the service layer (early return) and by the DB primary key on `accident_id`.
- **Hospital fallback**: any network/HTTP error from the hospital service falls back to `mock_hospitals.py` with clearly-labelled test data.
- **Notifications**: entirely mocked (console + DB log). The only place to add Twilio is `backend/notifications/dispatcher.py`.
- **Auth roles**: `hospital` → read events/patients, acknowledge; `admin` → all + create patients.
- **Postgres**: change only `DATABASE_URL` in `.env`. All models use SQLAlchemy ORM with no SQLite-specific SQL.
