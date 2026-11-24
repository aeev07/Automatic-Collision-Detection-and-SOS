# Automated Vehicle Collision Detection & Direct Emergency Hospital Dispatch System

Simulated pipeline: sensor data -> collision verification -> nearest hospital -> mocked SMS/voice alert -> hospital dashboard.

## Quick start
```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp backend/.env.example backend/.env
```
Run each module (from repo root):
```bash
uvicorn collision_engine.api.main:app --port 8001 --reload
uvicorn hospital_intelligence.api.main:app --port 8002 --reload
uvicorn backend.api.main:app --port 8000 --reload
cd frontend && npm install && npm run dev
```

## Ownership (do not edit another person's folder)
| Folder | Owner | Branch |
|---|---|---|
| backend/ (core) | Nivedita | feature/emergency-backend |
| backend/notifications, patients, auth | Freny | feature/backend-notifications |
| collision_engine/, hospital_intelligence/ | Devansh | feature/collision-detection, feature/hospital-finder |
| frontend/ | Vaibhav | feature/hospital-dashboard |

Shared contracts: see `docs/CONTRACTS.md`. Change them only by telling the group.

## Rules
- Work on your own branch; open a PR into `main`; nobody pushes to `main`.
- Never commit `.env`. Notifications stay mocked (`MOCK_NOTIFICATIONS=true`).
- Push every 30-45 minutes.

## Limitations
Simulated data only (no real crash validation). Cheap sensors saturate near 16g. OSM hospital contact data is sparse. Notifications are mocked. A real deployment would route via 112.
