from typing import Optional

from fastapi import APIRouter, Query

from src.models.schemas import EmailDetail, EmailSummary, SendEmailRequest

router = APIRouter()


@router.get("/", response_model=list[EmailSummary])
def list_emails(
    folder: str = Query("inbox", pattern="^(inbox|sent)$"),
    query: Optional[str] = None,
    sender: Optional[str] = None,
    after: Optional[str] = None,
    before: Optional[str] = None,
    unread_only: bool = False,
    limit: int = 25,
):
    """List inbox/sent emails with optional filters (used by both UI and assistant)."""
    # TODO: call mail_service.list_emails(...)
    return []


@router.get("/{email_id}", response_model=EmailDetail)
def get_email(email_id: str):
    """Fetch the full content of a single email."""
    # TODO: call mail_service.get_email(email_id)
    raise NotImplementedError


@router.post("/send")
def send_email(payload: SendEmailRequest):
    """Send an email (also used for replies via reply_to_message_id)."""
    # TODO: call mail_service.send_email(payload)
    return {"ok": True}


@router.post("/{email_id}/read")
def mark_read(email_id: str):
    # TODO: mark the message as read
    return {"ok": True}
