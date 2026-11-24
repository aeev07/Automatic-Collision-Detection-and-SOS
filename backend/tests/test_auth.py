"""Tests for auth (401/403) and patient access control."""

import pytest
from unittest.mock import patch

from backend.tests.conftest import HOSPITAL_HEADERS, ADMIN_HEADERS, BAD_HEADERS, make_event_payload, make_patient_payload

MOCK_HOSPITAL = {
    "name": "MOCK Hospital A (test data)",
    "latitude": 26.86,
    "longitude": 80.96,
    "source": "mock",
}


# ── Auth: missing / bad key → 401 ────────────────────────────────────────────

def test_get_events_no_key_401(client):
    r = client.get("/api/v1/events")
    assert r.status_code == 401


def test_get_events_bad_key_401(client):
    r = client.get("/api/v1/events", headers=BAD_HEADERS)
    assert r.status_code == 401


@patch("backend.integrations.hospital_client.find_nearest_hospital", return_value=MOCK_HOSPITAL)
def test_post_events_no_key_401(mock_h, client):
    r = client.post("/api/v1/events", json=make_event_payload())
    assert r.status_code == 401


# ── Auth: health requires no key ─────────────────────────────────────────────

def test_health_no_key_200(client):
    r = client.get("/health")
    assert r.status_code == 200


# ── Patient: hospital key can read ───────────────────────────────────────────

def test_patient_get_hospital_key(client):
    # Create via admin first
    client.post("/api/v1/patients", json=make_patient_payload(), headers=ADMIN_HEADERS)
    r = client.get("/api/v1/patients/PT-TEST-001", headers=HOSPITAL_HEADERS)
    assert r.status_code == 200


def test_patient_get_no_key_401(client):
    r = client.get("/api/v1/patients/PT-TEST-001")
    assert r.status_code == 401


def test_patient_get_bad_key_401(client):
    r = client.get("/api/v1/patients/PT-TEST-001", headers=BAD_HEADERS)
    assert r.status_code == 401


# ── Patient: hospital key CANNOT create ──────────────────────────────────────

def test_patient_create_hospital_key_403(client):
    r = client.post("/api/v1/patients", json=make_patient_payload(), headers=HOSPITAL_HEADERS)
    assert r.status_code == 403


def test_patient_create_bad_key_401(client):
    r = client.post("/api/v1/patients", json=make_patient_payload(), headers=BAD_HEADERS)
    assert r.status_code == 401


# ── Patient: admin key can create and read ───────────────────────────────────

def test_patient_create_admin_key_201(client):
    r = client.post("/api/v1/patients", json=make_patient_payload(), headers=ADMIN_HEADERS)
    assert r.status_code == 201
    body = r.json()
    assert body["patient_id"] == "PT-TEST-001"
    assert body["blood_group"] == "O+"
    assert "penicillin" in body["allergies"]


def test_patient_create_duplicate_409(client):
    client.post("/api/v1/patients", json=make_patient_payload(), headers=ADMIN_HEADERS)
    r = client.post("/api/v1/patients", json=make_patient_payload(), headers=ADMIN_HEADERS)
    assert r.status_code == 409


def test_patient_get_404(client):
    r = client.get("/api/v1/patients/PT-NO-SUCH", headers=HOSPITAL_HEADERS)
    assert r.status_code == 404
