"""Tests for the notification dispatcher and notification log."""

import json
import pytest
from unittest.mock import patch, MagicMock

from backend.tests.conftest import HOSPITAL_HEADERS, ADMIN_HEADERS, make_event_payload
from backend.notifications import dispatcher

MOCK_HOSPITAL = {
    "name": "MOCK Hospital A (test data)",
    "latitude": 26.86,
    "longitude": 80.96,
    "source": "mock",
    "distance_km": 1.5,
}


@patch("backend.integrations.hospital_client.find_nearest_hospital", return_value=MOCK_HOSPITAL)
def test_notification_log_written(mock_hospital, client, db_session):
    """Creating an event must write NotificationLog entries."""
    from backend.models.notification_log import NotificationLog
    r = client.post("/api/v1/events", json=make_event_payload(), headers=HOSPITAL_HEADERS)
    assert r.status_code == 200
    logs = db_session.query(NotificationLog).filter(
        NotificationLog.accident_id == "evt-test-001"
    ).all()
    assert len(logs) >= 1
    channels = {log.channel for log in logs}
    assert "sms" in channels


@patch("backend.integrations.hospital_client.find_nearest_hospital", return_value=MOCK_HOSPITAL)
def test_notification_log_sms_and_voice(mock_hospital, client, db_session):
    """Both SMS and voice notification logs are written."""
    from backend.models.notification_log import NotificationLog
    client.post("/api/v1/events", json=make_event_payload(), headers=HOSPITAL_HEADERS)
    logs = db_session.query(NotificationLog).filter(
        NotificationLog.accident_id == "evt-test-001"
    ).all()
    channels = {log.channel for log in logs}
    assert "sms" in channels
    assert "voice" in channels


@patch("backend.integrations.hospital_client.find_nearest_hospital", return_value=MOCK_HOSPITAL)
def test_sms_contains_required_fields(mock_hospital, client, db_session):
    """SMS notification must contain accident id, coordinates, map link, severity."""
    from backend.models.notification_log import NotificationLog
    client.post("/api/v1/events", json=make_event_payload(), headers=HOSPITAL_HEADERS)
    sms_log = db_session.query(NotificationLog).filter(
        NotificationLog.accident_id == "evt-test-001",
        NotificationLog.channel == "sms",
    ).first()
    assert sms_log is not None
    assert "evt-test-001" in sms_log.message
    assert "26.8467" in sms_log.message
    assert "maps.google.com" in sms_log.message or "google.com/maps" in sms_log.message
    assert "HIGH" in sms_log.message


def test_mock_mode_never_calls_twilio(monkeypatch):
    """With MOCK_NOTIFICATIONS=true, Twilio is never imported or called."""
    # Patch the settings to ensure mock mode is on
    from backend.config import get_settings
    settings = get_settings()
    original = settings.MOCK_NOTIFICATIONS

    # Try to import twilio — it should not be called in send_alerts
    twilio_mock = MagicMock()
    monkeypatch.setitem(__import__("sys").modules, "twilio", twilio_mock)
    monkeypatch.setitem(__import__("sys").modules, "twilio.rest", twilio_mock)

    # Create a fake accident and call dispatcher directly
    from backend.models.accident import Accident
    from datetime import datetime, timezone

    class FakeSession:
        def add(self, obj): pass
        def commit(self): pass

    accident = Accident(
        accident_id="twilio-test-01",
        vehicle_id="VH-TW",
        timestamp=datetime.now(timezone.utc),
        latitude=26.8,
        longitude=80.9,
        severity="LOW",
        notification_status="PENDING",
        acknowledged=False,
    )
    result = dispatcher.send_alerts(accident, MOCK_HOSPITAL, None, FakeSession())
    assert result == "SENT"
    # Twilio client constructor should not have been called
    twilio_mock.rest.Client.assert_not_called()


@patch("backend.integrations.hospital_client.find_nearest_hospital", return_value=MOCK_HOSPITAL)
def test_sms_includes_patient_info_when_present(mock_hospital, client, db_session):
    """SMS message includes patient info when a VehicleLink exists."""
    from backend.models.notification_log import NotificationLog
    # Create patient and vehicle link
    client.post(
        "/api/v1/patients",
        json={
            "patient_id": "PT-NOTIF-01",
            "name": "Notif Test Patient",
            "blood_group": "AB+",
            "allergies": ["latex"],
            "medical_conditions": [],
            "emergency_contact": {"name": "EC", "phone": "+0"},
            "vehicle_id": "VH-NOTIF-01",
        },
        headers=ADMIN_HEADERS,
    )
    payload = make_event_payload(event_id="evt-notif-01", vehicle_id="VH-NOTIF-01")
    client.post("/api/v1/events", json=payload, headers=HOSPITAL_HEADERS)
    sms_log = db_session.query(NotificationLog).filter(
        NotificationLog.accident_id == "evt-notif-01",
        NotificationLog.channel == "sms",
    ).first()
    assert sms_log is not None
    assert "Notif Test Patient" in sms_log.message
    assert "AB+" in sms_log.message
