"""Pydantic v2 schemas matching docs/CONTRACTS.md exactly."""

from .accident import AccidentCreate, AccidentOut
from .patient import PatientCreate, PatientOut
from .hospital import HospitalOut
from .collision import CollisionAnalyzeRequest, CollisionAnalyzeResponse
from .notification_log import NotificationLogOut

__all__ = [
    "AccidentCreate",
    "AccidentOut",
    "PatientCreate",
    "PatientOut",
    "HospitalOut",
    "CollisionAnalyzeRequest",
    "CollisionAnalyzeResponse",
    "NotificationLogOut",
]
