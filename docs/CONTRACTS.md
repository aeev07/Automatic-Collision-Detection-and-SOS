# Shared API contracts (v1)

All timestamps ISO 8601 UTC. IDs are strings. Ports: collision 8001, hospital finder 8002, backend 8000.

## 1. Collision result  (collision_engine -> backend)
`POST :8001/api/v1/collision/analyze`

Request:
```json
{
  "vehicle_id": "VH-101",
  "timestamp": "2026-11-24T14:30:00Z",
  "readings": [
    {"t_ms": 0, "ax": 0.1, "ay": 0.0, "az": 1.0, "gx": 0.0, "gy": 0.0, "gz": 0.0}
  ]
}
```
Accel in g, gyro in deg/s.

Response:
```json
{
  "event_id": "evt_001",
  "vehicle_id": "VH-101",
  "timestamp": "2026-11-24T14:30:00Z",
  "collision_detected": true,
  "confidence_score": 0.91,
  "impact_magnitude": 11.2,
  "severity": "HIGH",
  "detection_reason": "Peak 11.2g sustained 40ms with gyro spike; ruled out pothole/braking"
}
```
`severity`: LOW | MEDIUM | HIGH | CRITICAL (null if no collision)

## 2. Hospital finder  (hospital_intelligence -> backend)
`POST :8002/api/v1/location/nearest-hospitals`

Request: `{"latitude": 26.8467, "longitude": 80.9462, "radius_km": 15}`

Response:
```json
{
  "hospitals": [
    {
      "name": "Example Hospital",
      "latitude": 26.85,
      "longitude": 80.95,
      "address": "string or null",
      "phone": "string or null",
      "distance_km": 1.2,
      "road_distance_km": 1.6,
      "eta_min": 5,
      "route": [[26.8467, 80.9462], [26.85, 80.95]]
    }
  ],
  "source": "overpass | mock"
}
```
Missing fields are `null`, never invented. `route` is `[lat, lng]` pairs, may be empty.

## 3. Backend event API  (backend -> frontend)
Header on protected routes: `X-API-Key: <key>`

- `POST /api/v1/events`  body = collision result + `latitude`, `longitude`; creates the accident, finds hospital, sends (mock) notifications. Duplicate `event_id` returns the existing record (HTTP 200), not a new one.
- `GET /api/v1/events?severity=&status=&q=`  -> list of Accident
- `GET /api/v1/events/{event_id}`  -> Accident
- `POST /api/v1/events/{event_id}/acknowledge`  -> Accident with status ACKNOWLEDGED

Accident:
```json
{
  "accident_id": "evt_001",
  "vehicle_id": "VH-101",
  "timestamp": "2026-11-24T14:30:00Z",
  "latitude": 26.8467,
  "longitude": 80.9462,
  "severity": "HIGH",
  "impact_magnitude": 11.2,
  "selected_hospital": { "...hospital object from section 2..." },
  "notification_status": "SENT",
  "acknowledged": false,
  "acknowledged_at": null,
  "patient_id": "PT-001"
}
```
`notification_status`: PENDING | SENT | FAILED. Acknowledgement is tracked separately (`acknowledged`) from delivery.

## 4. Patient API
- `POST /api/v1/patients`   (admin key)
- `GET /api/v1/patients/{patient_id}`  (hospital or admin key; 401/403 otherwise)

Patient:
```json
{
  "patient_id": "PT-001",
  "name": "string",
  "blood_group": "O+",
  "allergies": ["string"],
  "medical_conditions": ["string"],
  "emergency_contact": {"name": "string", "phone": "string"}
}
```
Vehicle -> patient link: `vehicle_id` maps to one `patient_id` (consent assumed for demo; real system needs explicit consent).

## Errors
`{"detail": "message"}` with standard HTTP codes (400 validation, 401/403 auth, 404 not found, 502 upstream failure).
