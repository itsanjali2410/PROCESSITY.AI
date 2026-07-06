from fastapi import HTTPException
from google.oauth2.credentials import Credentials

from src.services import token_store


def require_credentials() -> Credentials:
    """FastAPI dependency: valid Google credentials or 401."""
    creds = token_store.load()
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated. Visit /auth/login.")
    return creds
