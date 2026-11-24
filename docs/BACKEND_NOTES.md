# Backend Implementation Notes

## Decisions & Assumptions

### 1. `event_id` vs `accident_id` field name
CONTRACTS.md section 3 names the response field `accident_id`, but the collision engine response (section 1) returns `event_id`.  
**Decision**: The `AccidentCreate` schema accepts `event_id` as input (matching the collision engine output) and stores it as `accident_id` in the DB and all responses.  This follows the simplest interpretation: the same UUID just has different names at the API boundary.

### 2. `selected_hospital` stored as JSON text
SQLite has no native JSON column type. We store `selected_hospital` as a `Text` column containing a JSON string and deserialise it in the route layer before returning. PostgreSQL handles this transparently via the same SQLAlchemy `Text` type.

### 3. `notification_status` vs `acknowledged` are independent
Per CONTRACTS.md: "Acknowledgement is tracked separately (`acknowledged`) from delivery."  
Acknowledging an event sets `acknowledged=True` and `acknowledged_at` but **never** changes `notification_status`.

### 4. Duplicate event handling
When `POST /api/v1/events` receives an `event_id` that already exists, it returns the existing `Accident` record with HTTP 200. `send_alerts` is NOT called again (checked before dispatcher is invoked in `event_service.create_event`). The DB primary key provides a second enforcement layer.

### 5. `POST /api/v1/simulate/analyze` with no collision
When the collision engine returns `collision_detected: false`, the route raises an `HTTPException(200, detail="No collision detected")`. This avoids returning a partial `AccidentOut` schema (which would be meaningless with no accident created). A future teammate may change this to a typed response schema.

### 6. `MOCK_NOTIFICATIONS=false` not fully implemented
The dispatcher logs a warning and continues in mock mode. A teammate will add real Twilio calls by editing only `backend/notifications/dispatcher.py` inside the existing `if not settings.MOCK_NOTIFICATIONS:` block.

### 7. `pydantic-settings` not used
The repo's `requirements.txt` does not include `pydantic-settings`. `backend/config.py` uses `python-dotenv` + `os.environ` directly (a plain Python class) rather than `pydantic.BaseSettings`. Same behaviour, no extra dependency.

### 8. `simulate/analyze` requires `latitude` and `longitude`
These are not in the original collision engine request schema (CONTRACTS.md section 1) but are needed to find the nearest hospital. They are added as optional fields to `CollisionAnalyzeRequest` and validated as required specifically for the simulate route.

### 9. Mock hospital naming convention
All mock/fallback hospitals follow the pattern `"MOCK Hospital X (test data)"` to make it unambiguous that they are not real facilities. Real hospital names are never invented.

### 10. Auth on POST /api/v1/events
CONTRACTS.md says "Header on protected routes: `X-API-Key`". POST /events is treated as a protected route requiring hospital or admin key. The simulate route is intentionally left without auth so the collision engine can call it without credentials (a future decision).

### 11. `.env` committed for dev convenience
`backend/.env` is committed with safe dev-only placeholder keys. The repo `.gitignore` should exclude any production `.env`.
