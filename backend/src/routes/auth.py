import os

from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow

from src.core.config import settings
from src.core.deps import require_credentials
from src.services import mail_service, token_store

# Allow http://localhost redirects and scope-order differences in dev
os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")
os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")

router = APIRouter()

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/gmail.modify",
]


# PKCE code verifiers between /login and /callback, keyed by OAuth state
_pending_verifiers: dict[str, str] = {}


def _flow() -> Flow:
    return Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )


@router.get("/login")
def login():
    """Send the user to Google's consent screen."""
    flow = _flow()
    url, state = flow.authorization_url(access_type="offline", prompt="consent")
    _pending_verifiers[state] = flow.code_verifier
    return RedirectResponse(url)


@router.get("/callback")
def callback(code: str, state: str):
    """Exchange the OAuth code for tokens, store them, return to the app."""
    flow = _flow()
    flow.code_verifier = _pending_verifiers.pop(state, None)
    flow.fetch_token(code=code)
    token_store.save(flow.credentials)
    return RedirectResponse(settings.FRONTEND_URL)


@router.get("/me")
def me(creds=Depends(require_credentials)):
    return {"email": mail_service.profile(creds)}


@router.post("/logout")
def logout():
    token_store.clear()
    return {"ok": True}
