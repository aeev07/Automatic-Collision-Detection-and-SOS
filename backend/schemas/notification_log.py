"""Pydantic schema for NotificationLog."""

from datetime import datetime
from pydantic import BaseModel


class NotificationLogOut(BaseModel):
    id: int
    accident_id: str
    channel: str
    status: str
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}
