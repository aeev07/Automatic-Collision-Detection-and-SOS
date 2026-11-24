"""Re-export all ORM models so that importing this package registers them on Base."""

from .accident import Accident
from .patient import Patient, VehicleLink
from .notification_log import NotificationLog

__all__ = ["Accident", "Patient", "VehicleLink", "NotificationLog"]
