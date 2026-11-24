"""Shared pytest fixtures for in-memory SQLite and mocked httpx."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event as sa_event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database.session import get_db

# Use a single in-memory SQLite with StaticPool so ALL connections share the same DB
# (pure sqlite:// creates a fresh DB per connection; StaticPool reuses one connection)
TEST_DATABASE_URL = "sqlite://"


@pytest.fixture(scope="function")
def db_engine():
    """Create a fresh shared in-memory SQLite engine for each test with all tables."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # <-- key: single shared connection → tables visible everywhere
    )
    # Import all models so they register on Base before create_all
    import backend.models  # noqa: F401
    from backend.database.session import Base
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine):
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestingSession()
    yield session
    session.close()


@pytest.fixture(scope="function")
def client(db_session):
    """TestClient with:
    - database dependency overridden to use shared in-memory SQLite
    - create_tables patched to no-op (we already created them above)
    """
    from unittest.mock import patch
    from backend.api.main import app

    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # session closed in db_session fixture

    app.dependency_overrides[get_db] = override_get_db

    # Patch create_tables so the lifespan startup doesn't re-create tables on the global engine
    with patch("backend.api.main.create_tables", return_value=None):
        with TestClient(app, raise_server_exceptions=True) as c:
            yield c

    app.dependency_overrides.clear()


# ── Auth headers ──────────────────────────────────────────────────────────────
HOSPITAL_HEADERS = {"X-API-Key": "dev-hospital-key"}
ADMIN_HEADERS = {"X-API-Key": "dev-admin-key"}
BAD_HEADERS = {"X-API-Key": "wrong-key"}


# ── Sample payloads ───────────────────────────────────────────────────────────
def make_event_payload(event_id="evt-test-001", vehicle_id="VH-TEST-01"):
    return {
        "event_id": event_id,
        "vehicle_id": vehicle_id,
        "timestamp": "2026-11-24T10:00:00Z",
        "collision_detected": True,
        "confidence_score": 0.90,
        "impact_magnitude": 10.5,
        "severity": "HIGH",
        "latitude": 26.8467,
        "longitude": 80.9462,
    }


def make_patient_payload(patient_id="PT-TEST-001", vehicle_id=None):
    p = {
        "patient_id": patient_id,
        "name": "Test Patient (fake)",
        "blood_group": "O+",
        "allergies": ["penicillin"],
        "medical_conditions": ["asthma"],
        "emergency_contact": {"name": "Test Contact", "phone": "+00-000-0001"},
    }
    if vehicle_id:
        p["vehicle_id"] = vehicle_id
    return p
