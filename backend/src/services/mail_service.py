"""Gmail API integration.

All provider-specific logic lives here so routes stay thin and the provider
could be swapped (e.g. Microsoft Graph) without touching the API surface.
"""

import base64
import html
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from src.models.schemas import EmailDetail, EmailFilters, EmailSummary, SendEmailRequest
from src.services.cache import TTLCache

# Lists/threads change as mail arrives -> short TTL. Message bodies are
# immutable (only labels change) -> longer TTL. All are invalidated on writes
# and when the realtime poller sees new mail.
_list_cache = TTLCache(ttl_seconds=30)
_thread_cache = TTLCache(ttl_seconds=30)
_detail_cache = TTLCache(ttl_seconds=300)


def invalidate_caches() -> None:
    """Drop cached mail state after any change (send, read, new mail)."""
    _list_cache.clear()
    _thread_cache.clear()
    _detail_cache.clear()


def _gmail(creds: Credentials):
    return build("gmail", "v1", credentials=creds, cache_discovery=False)


def profile(creds: Credentials) -> str:
    return _gmail(creds).users().getProfile(userId="me").execute()["emailAddress"]


def _build_query(f: EmailFilters) -> str:
    parts = []
    if f.query:
        parts.append(f.query)
    if f.sender:
        parts.append(f"from:{f.sender}")
    if f.after:
        parts.append(f"after:{f.after:%Y/%m/%d}")
    if f.before:
        # Gmail's before: is exclusive — add a day so the picked date is included
        parts.append(f"before:{f.before + timedelta(days=1):%Y/%m/%d}")
    if f.unread_only:
        parts.append("is:unread")
    return " ".join(parts)


def _header(payload: dict, name: str) -> str:
    headers = payload.get("headers", [])
    return next((h["value"] for h in headers if h["name"].lower() == name.lower()), "")


def _to_summary(msg: dict) -> EmailSummary:
    return EmailSummary(
        id=msg["id"],
        thread_id=msg.get("threadId"),
        sender=_header(msg["payload"], "From"),
        subject=_header(msg["payload"], "Subject") or "(no subject)",
        preview=html.unescape(msg.get("snippet", "")),  # Gmail snippets are HTML-escaped
        date=datetime.fromtimestamp(int(msg["internalDate"]) / 1000, tz=timezone.utc),
        is_read="UNREAD" not in msg.get("labelIds", []),
    )


def list_emails(creds: Credentials, filters: EmailFilters) -> list[EmailSummary]:
    cache_key = filters.model_dump_json()
    if (cached := _list_cache.get(cache_key)) is not None:
        return cached
    gmail = _gmail(creds)
    label = "SENT" if filters.folder == "sent" else "INBOX"
    query = _build_query(filters)
    if filters.folder == "inbox":
        query = f"{query} -from:me".strip()  # own replies belong in Sent, not Inbox
    resp = (
        gmail.users()
        .messages()
        .list(userId="me", labelIds=[label], q=query, maxResults=filters.limit)
        .execute()
    )
    summaries = []
    for ref in resp.get("messages", []):
        msg = (
            gmail.users()
            .messages()
            .get(userId="me", id=ref["id"], format="metadata", metadataHeaders=["From", "Subject"])
            .execute()
        )
        summaries.append(_to_summary(msg))
    summaries.sort(key=lambda s: s.date, reverse=True)  # strictly newest first
    _list_cache.set(cache_key, summaries)
    return summaries


def _decode(data: str) -> str:
    return base64.urlsafe_b64decode(data).decode(errors="replace")


def _extract_bodies(payload: dict) -> tuple[str | None, str | None]:
    """Walk the MIME tree and return (text, html) bodies."""
    text = html = None
    stack = [payload]
    while stack:
        part = stack.pop()
        stack.extend(part.get("parts", []))
        data = part.get("body", {}).get("data")
        if not data:
            continue
        if part.get("mimeType") == "text/plain" and text is None:
            text = _decode(data)
        elif part.get("mimeType") == "text/html" and html is None:
            html = _decode(data)
    return text, html


def _to_detail(msg: dict) -> EmailDetail:
    text, html = _extract_bodies(msg["payload"])
    summary = _to_summary(msg)
    to = [addr.strip() for addr in _header(msg["payload"], "To").split(",") if addr.strip()]
    return EmailDetail(**summary.model_dump(), to=to, body_text=text, body_html=html)


def get_email(creds: Credentials, email_id: str) -> EmailDetail:
    if (cached := _detail_cache.get(email_id)) is not None:
        return cached
    msg = _gmail(creds).users().messages().get(userId="me", id=email_id, format="full").execute()
    detail = _to_detail(msg)
    _detail_cache.set(email_id, detail)
    return detail


def get_thread(creds: Credentials, thread_id: str) -> list[EmailDetail]:
    """All messages of a conversation, oldest first."""
    if (cached := _thread_cache.get(thread_id)) is not None:
        return cached
    thread = _gmail(creds).users().threads().get(userId="me", id=thread_id, format="full").execute()
    details = [_to_detail(msg) for msg in thread.get("messages", [])]
    details.sort(key=lambda d: d.date)  # conversation reads oldest -> newest
    _thread_cache.set(thread_id, details)
    return details


def latest_inbox_message_id(creds: Credentials) -> str | None:
    """Cheap probe used by the real-time poller."""
    resp = (
        _gmail(creds)
        .users()
        .messages()
        .list(userId="me", labelIds=["INBOX"], maxResults=1)
        .execute()
    )
    messages = resp.get("messages", [])
    return messages[0]["id"] if messages else None


def send_email(creds: Credentials, payload: SendEmailRequest) -> str:
    """Send a new email, or a threaded reply when reply_to_message_id is set."""
    gmail = _gmail(creds)
    msg = EmailMessage()
    msg["To"] = payload.to
    msg["Subject"] = payload.subject
    msg.set_content(payload.body)

    body: dict = {}
    if payload.reply_to_message_id:
        orig = (
            gmail.users()
            .messages()
            .get(userId="me", id=payload.reply_to_message_id, format="metadata",
                 metadataHeaders=["Message-ID"])
            .execute()
        )
        if message_id := _header(orig["payload"], "Message-ID"):
            msg["In-Reply-To"] = message_id
            msg["References"] = message_id
        body["threadId"] = orig.get("threadId")

    body["raw"] = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    sent_id = gmail.users().messages().send(userId="me", body=body).execute()["id"]
    invalidate_caches()
    return sent_id


def mark_read(creds: Credentials, email_id: str) -> None:
    _gmail(creds).users().messages().modify(
        userId="me", id=email_id, body={"removeLabelIds": ["UNREAD"]}
    ).execute()
    invalidate_caches()
