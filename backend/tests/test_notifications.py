"""Tests for the notification dispatcher and notification log."""

import logging
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from backend.models.accident import Accident
from backend.models.notification_log import NotificationLog
from backend.notifications import dispatcher
from backend.tests.conftest import ADMIN_HEADERS, HOSPITAL_HEADERS, make_event_payload

MOCK_HOSPITAL = {
    "name": "MOCK Hospital A (test data)",
    "latitude": 26.86,
    "longitude": 80.96,
    "phone": "+91-9999999999",
    "source": "mock",
    "distance_km": 1.5,
}


def _make_accident(accident_id="twilio-test-01", severity="LOW"):
    return Accident(
        accident_id=accident_id,
        vehicle_id="VH-TW",
        timestamp=datetime.now(timezone.utc),
        latitude=26.8467,
        longitude=80.9462,
        severity=severity,
        notification_status="PENDING",
        acknowledged=False,
    )


def _make_settings(**overrides):
    defaults = {
        "MOCK_NOTIFICATIONS": False,
        "TWILIO_ACCOUNT_SID": "ACtest0000000000000000000000000000",
        "TWILIO_AUTH_TOKEN": "secret-auth-token-do-not-log",
        "TWILIO_PHONE_NUMBER": "+15550001111",
        "HOSPITAL_ALERT_PHONE": "+15550002222",
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


@patch("backend.integrations.hospital_client.find_nearest_hospital", return_value=MOCK_HOSPITAL)
def test_notification_log_written(mock_hospital, client, db_session):
    """Creating an event must write NotificationLog entries."""
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
    monkeypatch.setattr(dispatcher, "get_settings", lambda: _make_settings(MOCK_NOTIFICATIONS=True))

    twilio_mock = MagicMock()
    monkeypatch.setitem(__import__("sys").modules, "twilio", twilio_mock)
    monkeypatch.setitem(__import__("sys").modules, "twilio.rest", twilio_mock)

    class FakeSession:
        def add(self, obj):
            pass

        def commit(self):
            pass

    accident = _make_accident()
    result = dispatcher.send_alerts(accident, MOCK_HOSPITAL, None, FakeSession())
    assert result == "SENT"
    twilio_mock.Client.assert_not_called()
    twilio_mock.rest.Client.assert_not_called()


@patch("backend.integrations.hospital_client.find_nearest_hospital", return_value=MOCK_HOSPITAL)
def test_sms_includes_patient_info_when_present(mock_hospital, client, db_session):
    """SMS message includes patient info when a VehicleLink exists."""
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


@patch("backend.integrations.hospital_client.find_nearest_hospital", return_value=MOCK_HOSPITAL)
def test_voice_script_excludes_patient_personal_data(mock_hospital, client, db_session):
    """Voice script states collision/event/vehicle/coords/severity/hospital only — no patient name or blood group."""
    client.post(
        "/api/v1/patients",
        json={
            "patient_id": "PT-VOICE-01",
            "name": "Private Patient Name",
            "blood_group": "O-",
            "allergies": ["peanuts"],
            "medical_conditions": [],
            "emergency_contact": {"name": "EC", "phone": "+0"},
            "vehicle_id": "VH-VOICE-01",
        },
        headers=ADMIN_HEADERS,
    )
    payload = make_event_payload(event_id="evt-voice-01", vehicle_id="VH-VOICE-01")
    client.post("/api/v1/events", json=payload, headers=HOSPITAL_HEADERS)
    voice_log = db_session.query(NotificationLog).filter(
        NotificationLog.accident_id == "evt-voice-01",
        NotificationLog.channel == "voice",
    ).first()
    assert voice_log is not None
    assert "collision" in voice_log.message.lower()
    assert "evt-voice-01" in voice_log.message
    assert "VH-VOICE-01" in voice_log.message
    assert "26.8467" in voice_log.message
    assert "80.9462" in voice_log.message
    assert "high" in voice_log.message.lower()
    assert MOCK_HOSPITAL["name"] in voice_log.message
    assert "Private Patient Name" not in voice_log.message
    assert "O-" not in voice_log.message


def test_twilio_real_send_uses_hospital_alert_phone_and_escapes_twiml(monkeypatch, db_session):
    """Real Twilio mode sends SMS and XML-escaped TwiML voice call only to HOSPITAL_ALERT_PHONE."""
    settings = _make_settings()
    monkeypatch.setattr(dispatcher, "get_settings", lambda: settings)

    fake_client = MagicMock()
    fake_client.messages.create.return_value = MagicMock(sid="SM123456")
    fake_client.calls.create.return_value = MagicMock(sid="CA654321")
    fake_client_cls = MagicMock(return_value=fake_client)
    monkeypatch.setattr("twilio.rest.Client", fake_client_cls)

    hospital = {
        **MOCK_HOSPITAL,
        "name": "City Trauma & <Care>",
        "phone": "+91-8888888888",
    }
    patient = SimpleNamespace(
        name="Sensitive Name",
        blood_group="B+",
        allergies=[],
        medical_conditions=[],
        emergency_contact=None,
    )
    accident = _make_accident(accident_id="evt-real-01", severity="CRITICAL")

    result = dispatcher.send_alerts(accident, hospital, patient, db_session)

    assert result == "SENT"
    fake_client_cls.assert_called_once_with(
        settings.TWILIO_ACCOUNT_SID,
        settings.TWILIO_AUTH_TOKEN,
    )
    fake_client.messages.create.assert_called_once()
    sms_kwargs = fake_client.messages.create.call_args.kwargs
    assert sms_kwargs["from_"] == "+15550001111"
    assert sms_kwargs["to"] == "+15550002222"
    assert "+91-8888888888" not in sms_kwargs["to"]
    assert "evt-real-01" in sms_kwargs["body"]

    fake_client.calls.create.assert_called_once()
    call_kwargs = fake_client.calls.create.call_args.kwargs
    assert call_kwargs["from_"] == "+15550001111"
    assert call_kwargs["to"] == "+15550002222"
    assert call_kwargs["twiml"].startswith("<Response><Say>")
    assert call_kwargs["twiml"].endswith("</Say></Response>")
    assert "City Trauma &amp; &lt;Care&gt;" in call_kwargs["twiml"]
    assert "Sensitive Name" not in call_kwargs["twiml"]
    assert "B+" not in call_kwargs["twiml"]

    logs = db_session.query(NotificationLog).filter(
        NotificationLog.accident_id == "evt-real-01"
    ).all()
    assert len(logs) == 2
    by_channel = {log.channel: log for log in logs}
    assert by_channel["sms"].status == "SENT"
    assert "SM123456" in by_channel["sms"].message
    assert by_channel["voice"].status == "SENT"
    assert "CA654321" in by_channel["voice"].message
    assert settings.TWILIO_AUTH_TOKEN not in by_channel["sms"].message
    assert settings.TWILIO_AUTH_TOKEN not in by_channel["voice"].message


def test_twilio_exception_yields_failed_and_does_not_raise(monkeypatch, db_session):
    """When both Twilio channels raise, send_alerts logs FAILED rows and returns FAILED."""
    settings = _make_settings()
    monkeypatch.setattr(dispatcher, "get_settings", lambda: settings)

    fake_client = MagicMock()
    fake_client.messages.create.side_effect = RuntimeError("Twilio SMS down")
    fake_client.calls.create.side_effect = RuntimeError("Twilio Voice down")
    monkeypatch.setattr("twilio.rest.Client", MagicMock(return_value=fake_client))

    accident = _make_accident(accident_id="evt-fail-01", severity="HIGH")
    result = dispatcher.send_alerts(accident, MOCK_HOSPITAL, None, db_session)

    assert result == "FAILED"
    logs = db_session.query(NotificationLog).filter(
        NotificationLog.accident_id == "evt-fail-01"
    ).all()
    assert len(logs) == 2
    assert all(log.status == "FAILED" for log in logs)


def test_twilio_partial_failure_returns_sent(monkeypatch, db_session):
    """If one Twilio channel succeeds and the other raises, return SENT and log each status."""
    settings = _make_settings()
    monkeypatch.setattr(dispatcher, "get_settings", lambda: settings)

    fake_client = MagicMock()
    fake_client.messages.create.return_value = MagicMock(sid="SM999")
    fake_client.calls.create.side_effect = RuntimeError("Voice timeout")
    monkeypatch.setattr("twilio.rest.Client", MagicMock(return_value=fake_client))

    accident = _make_accident(accident_id="evt-partial-01", severity="MEDIUM")
    result = dispatcher.send_alerts(accident, MOCK_HOSPITAL, None, db_session)

    assert result == "SENT"
    logs = db_session.query(NotificationLog).filter(
        NotificationLog.accident_id == "evt-partial-01"
    ).all()
    by_channel = {log.channel: log for log in logs}
    assert by_channel["sms"].status == "SENT"
    assert by_channel["voice"].status == "FAILED"


@pytest.mark.parametrize(
    "missing_field",
    [
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_PHONE_NUMBER",
        "HOSPITAL_ALERT_PHONE",
    ],
)
def test_missing_twilio_credentials_falls_back_to_mock(
    monkeypatch, db_session, caplog, missing_field
):
    """With MOCK_NOTIFICATIONS=false and any missing credential or target phone, fall back to mock."""
    settings = _make_settings(**{missing_field: ""})
    monkeypatch.setattr(dispatcher, "get_settings", lambda: settings)

    fake_client_cls = MagicMock()
    monkeypatch.setattr("twilio.rest.Client", fake_client_cls)

    accident = _make_accident(accident_id=f"evt-fallback-{missing_field}")
    with caplog.at_level(logging.WARNING):
        result = dispatcher.send_alerts(accident, MOCK_HOSPITAL, None, db_session)

    assert result == "SENT"
    fake_client_cls.assert_not_called()
    assert any(missing_field in rec.message for rec in caplog.records)
    logs = db_session.query(NotificationLog).filter(
        NotificationLog.accident_id == accident.accident_id
    ).all()
    assert len(logs) == 2
    assert all(log.status == "SENT" for log in logs)


@patch("backend.integrations.hospital_client.find_nearest_hospital", return_value=MOCK_HOSPITAL)
def test_duplicate_event_does_not_trigger_second_twilio_send(
    mock_hospital, monkeypatch, client, db_session
):
    """Posting the same event_id twice must only send Twilio SMS/voice once."""
    settings = _make_settings()
    monkeypatch.setattr(dispatcher, "get_settings", lambda: settings)

    fake_client = MagicMock()
    fake_client.messages.create.return_value = MagicMock(sid="SM-DUP-1")
    fake_client.calls.create.return_value = MagicMock(sid="CA-DUP-1")
    fake_client_cls = MagicMock(return_value=fake_client)
    monkeypatch.setattr("twilio.rest.Client", fake_client_cls)

    payload = make_event_payload(event_id="evt-dup-twilio-01")
    r1 = client.post("/api/v1/events", json=payload, headers=HOSPITAL_HEADERS)
    r2 = client.post("/api/v1/events", json=payload, headers=HOSPITAL_HEADERS)

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r2.json()["accident_id"] == "evt-dup-twilio-01"
    fake_client_cls.assert_called_once()
    assert fake_client.messages.create.call_count == 1
    assert fake_client.calls.create.call_count == 1

    logs = db_session.query(NotificationLog).filter(
        NotificationLog.accident_id == "evt-dup-twilio-01"
    ).all()
    assert len(logs) == 2
