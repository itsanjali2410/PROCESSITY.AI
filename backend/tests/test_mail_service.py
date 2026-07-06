import base64
from datetime import datetime

from src.models.schemas import EmailFilters
from src.services.mail_service import _build_query, _extract_bodies, _header, _to_summary


def test_build_query_combines_filters():
    filters = EmailFilters(
        query="project", sender="sarah", after=datetime(2026, 6, 26), unread_only=True
    )
    assert _build_query(filters) == "project from:sarah after:2026/06/26 is:unread"


def test_build_query_before_is_inclusive():
    """Gmail's before: is exclusive, so the service must add one day."""
    filters = EmailFilters(before=datetime(2026, 7, 6))
    assert _build_query(filters) == "before:2026/07/07"


def test_build_query_empty_filters():
    assert _build_query(EmailFilters()) == ""


def test_header_is_case_insensitive():
    payload = {"headers": [{"name": "From", "value": "a@b.com"}]}
    assert _header(payload, "from") == "a@b.com"
    assert _header(payload, "Missing") == ""


def _b64(text: str) -> str:
    return base64.urlsafe_b64encode(text.encode()).decode()


def test_extract_bodies_walks_mime_tree():
    payload = {
        "mimeType": "multipart/alternative",
        "parts": [
            {"mimeType": "text/plain", "body": {"data": _b64("plain text")}},
            {"mimeType": "text/html", "body": {"data": _b64("<b>html</b>")}},
        ],
    }
    text, html = _extract_bodies(payload)
    assert text == "plain text"
    assert html == "<b>html</b>"


def test_to_summary_parses_message():
    msg = {
        "id": "m1",
        "threadId": "t1",
        "internalDate": "1751800000000",
        "snippet": "preview text",
        "labelIds": ["INBOX", "UNREAD"],
        "payload": {
            "headers": [
                {"name": "From", "value": "Jane <jane@x.com>"},
                {"name": "Subject", "value": "Hello"},
            ]
        },
    }
    summary = _to_summary(msg)
    assert summary.id == "m1"
    assert summary.thread_id == "t1"
    assert summary.sender == "Jane <jane@x.com>"
    assert summary.subject == "Hello"
    assert summary.is_read is False


def test_to_summary_defaults_missing_subject():
    msg = {"id": "m2", "internalDate": "1751800000000", "payload": {"headers": []}}
    assert _to_summary(msg).subject == "(no subject)"
