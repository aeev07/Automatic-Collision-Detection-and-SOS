"""Patient and VehicleLink ORM models."""

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.database.session import Base


class Patient(Base):
    """Stores patient medical information linked to vehicle IDs."""

    __tablename__ = "patients"

    patient_id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    blood_group: Mapped[str] = mapped_column(String(10), nullable=True)
    # JSON arrays/objects stored as Text
    allergies: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    medical_conditions: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    emergency_contact: Mapped[str] = mapped_column(Text, default="{}", nullable=False)


class VehicleLink(Base):
    """Maps a vehicle_id to a patient_id (one vehicle, one patient for demo)."""

    __tablename__ = "vehicle_links"

    vehicle_id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    patient_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
