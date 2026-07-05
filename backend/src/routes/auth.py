from fastapi import APIRouter

router = APIRouter()


@router.get("/login")
def login():
    """Redirect the user to the Google OAuth consent screen."""
    # TODO: build the Google OAuth URL and return a RedirectResponse
    return {"todo": "redirect to Google OAuth"}


@router.get("/callback")
def callback(code: str):
    """Exchange the OAuth code for tokens and start a session."""
    # TODO: exchange code, store tokens, set session cookie, redirect to frontend
    return {"todo": "handle OAuth callback"}


@router.get("/me")
def me():
    """Return the currently authenticated user."""
    # TODO: read session and return user profile
    return {"todo": "current user"}


@router.post("/logout")
def logout():
    # TODO: clear session
    return {"ok": True}
