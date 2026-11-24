"""Auth dependency: X-API-Key header with role-based access control.

Roles:
  hospital – read events, read patients, acknowledge events
  admin    – all hospital permissions plus create patients

Missing key → 401
Wrong role  → 403

Note: We use Optional[str] = Header(None, ...) so that a missing header returns
401 (our controlled response) rather than FastAPI's default 422 Unprocessable Entity.
"""

from typing import Optional

from fastapi import Header, HTTPException, status

from backend.config import get_settings


def _settings():
    return get_settings()


def require_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")) -> str:
    """Require ANY valid API key (hospital or admin). Returns the role string."""
    if x_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid API key",
        )
    settings = _settings()
    if x_api_key == settings.API_KEY_ADMIN:
        return "admin"
    if x_api_key == settings.API_KEY_HOSPITAL:
        return "hospital"
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid API key",
    )


def require_hospital_or_admin(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> str:
    """Hospital or admin key required (read access)."""
    return require_api_key(x_api_key)


def require_admin(x_api_key: Optional[str] = Header(None, alias="X-API-Key")) -> str:
    """Admin key required (write access to patients)."""
    if x_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid API key",
        )
    settings = _settings()
    if x_api_key == settings.API_KEY_ADMIN:
        return "admin"
    if x_api_key == settings.API_KEY_HOSPITAL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin key required",
        )
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid API key",
    )
