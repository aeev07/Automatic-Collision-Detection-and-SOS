"""Application configuration loaded from backend/.env via python-dotenv.

Uses python-dotenv + os.environ directly (no pydantic-settings dependency)
so it works with the existing requirements.txt.
"""

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Load .env from backend/.env (relative to this file's directory)
_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path, override=False)


class Settings:
    """All environment-driven settings.  Loaded once and cached."""

    def __init__(self):
        self.DATABASE_URL: str = os.getenv(
            "DATABASE_URL", "sqlite:///./vehicle_emergency.db"
        )
        self.HOSPITAL_SERVICE_URL: str = os.getenv(
            "HOSPITAL_SERVICE_URL", "http://localhost:8002"
        )
        self.COLLISION_SERVICE_URL: str = os.getenv(
            "COLLISION_SERVICE_URL", "http://localhost:8001"
        )
        self.API_KEY_HOSPITAL: str = os.getenv("API_KEY_HOSPITAL", "dev-hospital-key")
        self.API_KEY_ADMIN: str = os.getenv("API_KEY_ADMIN", "dev-admin-key")
        self.MOCK_NOTIFICATIONS: bool = (
            os.getenv("MOCK_NOTIFICATIONS", "true").lower() != "false"
        )
        self.TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings singleton."""
    return Settings()
