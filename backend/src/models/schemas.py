from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class EmailSummary(BaseModel):
    id: str
    thread_id: Optional[str] = None
    sender: str
    subject: str
    preview: str
    date: datetime
    is_read: bool = False


class EmailDetail(EmailSummary):
    to: list[str] = []
    body_html: Optional[str] = None
    body_text: Optional[str] = None


class SendEmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str
    reply_to_message_id: Optional[str] = None


class EmailFilters(BaseModel):
    folder: Literal["inbox", "sent"] = "inbox"
    query: Optional[str] = None
    sender: Optional[str] = None
    after: Optional[datetime] = None
    before: Optional[datetime] = None
    unread_only: bool = False
    limit: int = Field(25, ge=1, le=100)


class AssistantMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AssistantRequest(BaseModel):
    messages: list[AssistantMessage]
    # UI context so the assistant is context-aware
    current_view: Optional[str] = None       # inbox | sent | compose | email_detail
    open_email_id: Optional[str] = None


class UIAction(BaseModel):
    """Action the frontend executes to let the assistant drive the UI."""
    type: str          # navigate | fill_compose | apply_filters | open_email | send_email
    payload: dict = {}


class AssistantResponse(BaseModel):
    message: str
    actions: list[UIAction] = []
