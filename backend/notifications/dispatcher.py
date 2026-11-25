"""Notification dispatcher — the ONLY place where notification logic lives.

Default behaviour (MOCK_NOTIFICATIONS=true):
  - Builds SMS text and voice script.
  - Writes both to NotificationLog and to the console/log.
  - Returns "SENT".
  - NEVER imports or constructs Twilio.

Opt-in Twilio mode (MOCK_NOTIFICATIONS=false):
  - Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER,
    and HOSPITAL_ALERT_PHONE to all be set; otherwise logs a warning and
    falls back to mock mode.
  - Sends SMS and places a TwiML voice call ONLY to HOSPITAL_ALERT_PHONE.
  - Never includes personal patient details in the voice script.
"""

import json
import logging
from typing import Any, Dict, Optional
from xml.sax.saxutils import escape as xml_escape

from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.models.accident import Accident
from backend.models.notification_log import NotificationLog

logger = logging.getLogger(__name__)


def _build_sms_text(
    accident: Accident,
    hospital: Dict[str, Any],
    patient: Optional[Any],
) -> str:
    """Build the SMS alert message."""
    maps_link = (
        f"https://www.google.com/maps?q={accident.latitude},{accident.longitude}"
    )
    location_text = (
        f"{accident.latitude:.4f}, {accident.longitude:.4f}"
    )
    lines = [
        f"🚨 COLLISION ALERT — Event ID: {accident.accident_id}",
        f"Vehicle: {accident.vehicle_id}",
        f"Location: {location_text}  |  Map: {maps_link}",
        f"Severity: {accident.severity or 'UNKNOWN'}",
        f"Dispatching to: {hospital.get('name', 'Unknown Hospital')}",
    ]
    if patient:
        allergies = (
            json.loads(patient.allergies)
            if isinstance(patient.allergies, str)
            else patient.allergies
        )
        conditions = (
            json.loads(patient.medical_conditions)
            if isinstance(patient.medical_conditions, str)
            else patient.medical_conditions
        )
        ec_raw = patient.emergency_contact
        ec = json.loads(ec_raw) if isinstance(ec_raw, str) else ec_raw
        lines.append(f"Patient: {patient.name} | Blood: {patient.blood_group}")
        if allergies:
            lines.append(f"Allergies: {', '.join(allergies)}")
        if conditions:
            lines.append(f"Conditions: {', '.join(conditions)}")
        if ec:
            lines.append(f"Emergency contact: {ec.get('name')} {ec.get('phone')}")
    return "\n".join(lines)


def _build_voice_script(
    accident: Accident,
    hospital: Dict[str, Any],
) -> str:
    """Build the voice call script without personal patient data."""
    severity_phrase = {
        "CRITICAL": "critical",
        "HIGH": "high",
        "MEDIUM": "moderate",
        "LOW": "low",
    }.get(accident.severity or "", "unknown-severity")
    hospital_name = hospital.get("name") or "the nearest hospital"
    return (
        f"Attention. A {severity_phrase} severity vehicle collision has been detected. "
        f"Event identifier: {accident.accident_id}. "
        f"Vehicle: {accident.vehicle_id}. "
        f"Location coordinates: {accident.latitude:.4f} latitude, "
        f"{accident.longitude:.4f} longitude. "
        f"Emergency services are being dispatched to {hospital_name}."
    )


def _send_mock_alerts(
    accident: Accident,
    sms_text: str,
    voice_script: str,
    db: Session,
) -> str:
    """Log mocked SMS and voice alerts to NotificationLog and stdout."""
    try:
        sms_log = NotificationLog(
            accident_id=accident.accident_id,
            channel="sms",
            status="SENT",
            message=sms_text,
        )
        voice_log = NotificationLog(
            accident_id=accident.accident_id,
            channel="voice",
            status="SENT",
            message=voice_script,
        )
        db.add(sms_log)
        db.add(voice_log)
        db.commit()

        logger.info("=== MOCK SMS ===\n%s", sms_text)
        logger.info("=== MOCK VOICE ===\n%s", voice_script)
        print(f"\n[MOCK SMS]\n{sms_text}\n")
        print(f"[MOCK VOICE]\n{voice_script}\n")

        return "SENT"

    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to log notifications: %s", exc)
        return "FAILED"


def _send_twilio_alerts(
    accident: Accident,
    sms_text: str,
    voice_script: str,
    db: Session,
    *,
    account_sid: str,
    auth_token: str,
    from_number: str,
    to_number: str,
) -> str:
    """Send real SMS and voice alerts via Twilio and record NotificationLog rows."""
    try:
        from twilio.rest import Client

        client = Client(account_sid, auth_token)
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "Failed to initialize Twilio client for event %s: %s",
            accident.accident_id,
            exc,
        )
        sms_status = "FAILED"
        voice_status = "FAILED"
        sms_log_message = f"[Twilio FAILED: {exc}]\n{sms_text}"
        voice_log_message = f"[Twilio FAILED: {exc}]\n{voice_script}"
    else:
        try:
            sms_msg = client.messages.create(
                body=sms_text,
                from_=from_number,
                to=to_number,
            )
            sms_sid = getattr(sms_msg, "sid", None) or "unknown"
            sms_status = "SENT"
            sms_log_message = f"[Twilio SID: {sms_sid}]\n{sms_text}"
            logger.info(
                "Twilio SMS sent for event %s (sid=%s)",
                accident.accident_id,
                sms_sid,
            )
        except Exception as exc:  # noqa: BLE001
            sms_status = "FAILED"
            sms_log_message = f"[Twilio FAILED: {exc}]\n{sms_text}"
            logger.error(
                "Twilio SMS failed for event %s: %s",
                accident.accident_id,
                exc,
            )

        twiml = f"<Response><Say>{xml_escape(voice_script)}</Say></Response>"
        try:
            call = client.calls.create(
                twiml=twiml,
                from_=from_number,
                to=to_number,
            )
            call_sid = getattr(call, "sid", None) or "unknown"
            voice_status = "SENT"
            voice_log_message = f"[Twilio SID: {call_sid}]\n{voice_script}"
            logger.info(
                "Twilio voice call placed for event %s (sid=%s)",
                accident.accident_id,
                call_sid,
            )
        except Exception as exc:  # noqa: BLE001
            voice_status = "FAILED"
            voice_log_message = f"[Twilio FAILED: {exc}]\n{voice_script}"
            logger.error(
                "Twilio voice call failed for event %s: %s",
                accident.accident_id,
                exc,
            )

    try:
        db.add(
            NotificationLog(
                accident_id=accident.accident_id,
                channel="sms",
                status=sms_status,
                message=sms_log_message,
            )
        )
        db.add(
            NotificationLog(
                accident_id=accident.accident_id,
                channel="voice",
                status=voice_status,
                message=voice_log_message,
            )
        )
        db.commit()
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "Failed to persist Twilio notification logs for event %s: %s",
            accident.accident_id,
            exc,
        )
        return "FAILED"

    return "SENT" if (sms_status == "SENT" or voice_status == "SENT") else "FAILED"


def send_alerts(
    accident: Accident,
    hospital: Dict[str, Any],
    patient: Optional[Any],
    db: Session,
) -> str:
    """Send SMS and voice alerts (mocked by default, opt-in Twilio) and log them.

    Args:
        accident: The Accident ORM instance.
        hospital: Nearest hospital dict (from hospital_client).
        patient:  Patient ORM instance or None.
        db:       Active SQLAlchemy session for writing logs.

    Returns:
        "SENT" if mock mode succeeded or at least one Twilio channel succeeded,
        "FAILED" otherwise.
    """
    settings = get_settings()

    sms_text = _build_sms_text(accident, hospital, patient)
    voice_script = _build_voice_script(accident, hospital)

    if settings.MOCK_NOTIFICATIONS:
        return _send_mock_alerts(accident, sms_text, voice_script, db)

    account_sid = (settings.TWILIO_ACCOUNT_SID or "").strip()
    auth_token = (settings.TWILIO_AUTH_TOKEN or "").strip()
    from_number = (settings.TWILIO_PHONE_NUMBER or "").strip()
    to_number = (settings.HOSPITAL_ALERT_PHONE or "").strip()

    missing = [
        name
        for name, value in (
            ("TWILIO_ACCOUNT_SID", account_sid),
            ("TWILIO_AUTH_TOKEN", auth_token),
            ("TWILIO_PHONE_NUMBER", from_number),
            ("HOSPITAL_ALERT_PHONE", to_number),
        )
        if not value
    ]
    if missing:
        logger.warning(
            "MOCK_NOTIFICATIONS=false but missing required configuration (%s). "
            "Falling back to mock mode.",
            ", ".join(missing),
        )
        return _send_mock_alerts(accident, sms_text, voice_script, db)

    return _send_twilio_alerts(
        accident,
        sms_text,
        voice_script,
        db,
        account_sid=account_sid,
        auth_token=auth_token,
        from_number=from_number,
        to_number=to_number,
    )
