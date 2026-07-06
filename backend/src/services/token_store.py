"""File-based storage for the Google OAuth credentials of the single demo user.

Kept separate from the mail service so the storage strategy (file, DB,
per-user sessions) can change without touching Gmail logic.
"""

import json
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

TOKEN_FILE = Path(__file__).resolve().parents[2] / ".tokens.json"


def save(creds: Credentials) -> None:
    TOKEN_FILE.write_text(creds.to_json())


def load() -> Credentials | None:
    """Return valid credentials, refreshing them if expired, or None."""
    if not TOKEN_FILE.exists():
        return None
    creds = Credentials.from_authorized_user_info(json.loads(TOKEN_FILE.read_text()))
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        save(creds)
    return creds if creds.valid else None


def clear() -> None:
    TOKEN_FILE.unlink(missing_ok=True)
