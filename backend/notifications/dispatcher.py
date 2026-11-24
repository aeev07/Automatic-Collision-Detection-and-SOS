"""Notification dispatcher — the ONLY place where notification logic lives.

This module is intentionally kept small so a teammate can extend it with real
Twilio SMS/voice calls without touching any other backend files.

Current behaviour (MOCK_NOTIFICATIONS=true, default):
  - Builds SMS text and voice script.
  - Writes both to NotificationLog and to the console/log.
  - Returns "SENT".
  - NEVER calls Twilio.

When MOCK_NOTIFICATIONS=false a future teammate will add Twilio calls here.
"""

import json
import logging
from typing import Any, Dict, Optional

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
        import json as _json
        allergies = _json.loads(patient.allergies) if isinstance(patient.allergies, str) else patient.allergies
        conditions = _json.loads(patient.medical_conditions) if isinstance(patient.medical_conditions, str) else patient.medical_conditions
        ec_raw = patient.emergency_contact
        ec = _json.loads(ec_raw) if isinstance(ec_raw, str) else ec_raw
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
    patient: Optional[Any],
) -> str:
    """Build the voice call script."""
    severity_phrase = {
        "CRITICAL": "critical",
        "HIGH": "high",
        "MEDIUM": "moderate",
        "LOW": "low",
    }.get(accident.severity or "", "unknown-severity")
    text = (
        f"Attention. A {severity_phrase} severity vehicle collision has been detected. "
        f"Event identifier: {accident.accident_id}. "
        f"Vehicle: {accident.vehicle_id}. "
        f"Location coordinates: {accident.latitude:.4f} latitude, "
        f"{accident.longitude:.4f} longitude. "
        f"Emergency services are being dispatched to "
        f"{hospital.get('name', 'the nearest hospital')}. "
    )
    if patient:
        text += f"Patient name: {patient.name}. Blood group: {patient.blood_group}. "
    text += "Please stand by for further instructions."
    return text


def send_alerts(
    accident: Accident,
    hospital: Dict[str, Any],
    patient: Optional[Any],
    db: Session,
) -> str:
    """Send (mocked) SMS and voice alerts and log them.

    Args:
        accident: The Accident ORM instance.
        hospital: Nearest hospital dict (from hospital_client).
        patient:  Patient ORM instance or None.
        db:       Active SQLAlchemy session for writing logs.

    Returns:
        "SENT" on success, "FAILED" on any unexpected error.

    Note:
        MOCK_NOTIFICATIONS=true is the only supported mode.  When a teammate adds
        real Twilio logic they should check this flag here and return early for mock.
    """
    settings = get_settings()

    sms_text = _build_sms_text(accident, hospital, patient)
    voice_script = _build_voice_script(accident, hospital, patient)

    if not settings.MOCK_NOTIFICATIONS:
        # ── Placeholder for future Twilio integration ──────────────────────────
        # A teammate will add real Twilio calls here.
        # Example (do not implement yet):
        #   from twilio.rest import Client
        #   client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        #   client.messages.create(body=sms_text, from_=settings.TWILIO_PHONE_NUMBER, to=...)
        # ──────────────────────────────────────────────────────────────────────
        logger.warning(
            "MOCK_NOTIFICATIONS=false but Twilio integration not yet implemented. "
            "Falling back to mock mode."
        )

    try:
        # Log SMS
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
