from typing import Annotated

from fastapi import APIRouter, Depends, Query

from src.core.deps import require_credentials
from src.models.schemas import EmailDetail, EmailFilters, EmailSummary, SendEmailRequest
from src.services import mail_service

router = APIRouter()


@router.get("/", response_model=list[EmailSummary])
def list_emails(
    filters: Annotated[EmailFilters, Query()],
    creds=Depends(require_credentials),
):
    """List inbox/sent emails with optional filters (used by both UI and assistant)."""
    return mail_service.list_emails(creds, filters)


@router.get("/{email_id}", response_model=EmailDetail)
def get_email(email_id: str, creds=Depends(require_credentials)):
    """Fetch the full content of a single email."""
    return mail_service.get_email(creds, email_id)


@router.post("/send")
def send_email(payload: SendEmailRequest, creds=Depends(require_credentials)):
    """Send an email (also used for replies via reply_to_message_id)."""
    return {"id": mail_service.send_email(creds, payload)}


@router.post("/{email_id}/read")
def mark_read(email_id: str, creds=Depends(require_credentials)):
    mail_service.mark_read(creds, email_id)
    return {"ok": True}
