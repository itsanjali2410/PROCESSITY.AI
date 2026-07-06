
import json
from datetime import datetime, timezone

from email_validator import EmailNotValidError, validate_email
from google.oauth2.credentials import Credentials
from openai import OpenAI

from src.core.config import settings
from src.models.schemas import (
    AssistantRequest,
    AssistantResponse,
    EmailFilters,
    SendEmailRequest,
    UIAction,
)
from src.services import mail_service

MAX_TOOL_ROUNDS = 6

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_emails",
            "description": (
                "Search/filter emails. Results are returned to you AND shown "
                "in the main UI. Use for requests like 'show unread emails' "
                "or to find a specific email before opening it."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "folder": {"type": "string", "enum": ["inbox", "sent"]},
                    "query": {"type": "string", "description": "Keyword search"},
                    "sender": {"type": "string", "description": "Sender name or email"},
                    "after": {"type": "string", "description": "ISO date, e.g. 2026-07-01"},
                    "before": {"type": "string", "description": "ISO date"},
                    "unread_only": {"type": "boolean"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_email",
            "description": "Read the full content of one email by id (e.g. to draft a reply).",
            "parameters": {
                "type": "object",
                "properties": {"email_id": {"type": "string"}},
                "required": ["email_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "open_email",
            "description": "Navigate the UI to show a specific email in the detail view.",
            "parameters": {
                "type": "object",
                "properties": {"email_id": {"type": "string"}},
                "required": ["email_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fill_compose",
            "description": (
                "Open the compose view with fields visibly pre-filled. Use this "
                "to draft new emails and replies. Does NOT send."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {"type": "string"},
                    "subject": {"type": "string"},
                    "body": {"type": "string"},
                    "reply_to_message_id": {
                        "type": "string",
                        "description": "Set when replying, so the reply is threaded",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": (
                "Actually send an email. Only call this after the user has "
                "confirmed they want it sent."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {"type": "string"},
                    "subject": {"type": "string"},
                    "body": {"type": "string"},
                    "reply_to_message_id": {"type": "string"},
                },
                "required": ["to", "subject", "body"],
            },
        },
    },
]

SYSTEM_PROMPT = """You are the assistant inside a mail web application. You control the app's UI \
through your tools — searching, opening emails, and filling the compose form on the user's behalf.

Rules:
- Today's date is {today}. Compute date filters from it (e.g. "last 10 days").
- The user is currently on the "{current_view}" view.{open_email_note}
- To show emails, use search_emails — the UI updates automatically with the results.
- To open a specific email, first find its id via search_emails, then call open_email.
- To draft an email or a reply, use fill_compose so the user sees the form fill in. \
When replying, use get_email to read the original, address the reply to its sender, \
prefix the subject with "Re:", and pass reply_to_message_id.
- Recipient addresses must be complete (name@domain.tld). If the user gives a partial \
or missing address, ask for the full one — never guess or invent an address.
- Ask the user to confirm before calling send_email.
- Keep text replies short — the UI shows the results, you just narrate."""


def _invalid_recipient(args: dict) -> dict | None:
    """Reject incomplete addresses (e.g. 'john' or 'john@') before acting."""
    to = args.get("to")
    if not to:
        return None
    try:
        validate_email(to, check_deliverability=False)
        return None
    except EmailNotValidError:
        return {
            "error": f"'{to}' is not a complete email address. Ask the user for "
            "the full address, e.g. name@gmail.com or name@company.ai. "
            "Do not guess or auto-complete it."
        }


def _execute_tool(creds: Credentials, name: str, args: dict, actions: list[UIAction]) -> dict:
    """Run one tool call: query real data and/or record a UI action."""
    if name in ("fill_compose", "send_email") and (error := _invalid_recipient(args)):
        return error

    if name == "search_emails":
        filters = EmailFilters(**{k: v for k, v in args.items() if v})
        emails = mail_service.list_emails(creds, filters)
        actions.append(UIAction(type="apply_filters", payload=args))
        return {"count": len(emails), "emails": [e.model_dump(mode="json") for e in emails[:15]]}

    if name == "get_email":
        detail = mail_service.get_email(creds, args["email_id"])
        data = detail.model_dump(mode="json")
        data["body_text"] = (data.get("body_text") or "")[:3000]
        data.pop("body_html", None)
        return data

    if name == "open_email":
        actions.append(UIAction(type="open_email", payload=args))
        return {"ok": True}

    if name == "fill_compose":
        actions.append(UIAction(type="fill_compose", payload=args))
        return {"ok": True, "note": "Compose form filled. User can review and send."}

    if name == "send_email":
        message_id = mail_service.send_email(creds, SendEmailRequest(**args))
        actions.append(UIAction(type="navigate", payload={"path": "/sent"}))
        return {"ok": True, "message_id": message_id}

    return {"error": f"Unknown tool: {name}"}


def run(creds: Credentials, payload: AssistantRequest) -> AssistantResponse:
    client = OpenAI(api_key=settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)

    open_email_note = (
        f' They have email id "{payload.open_email_id}" open in the detail view.'
        if payload.open_email_id
        else ""
    )
    system = SYSTEM_PROMPT.format(
        today=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        current_view=payload.current_view or "inbox",
        open_email_note=open_email_note,
    )

    messages = [{"role": "system", "content": system}] + [
        {"role": m.role, "content": m.content} for m in payload.messages
    ]

    actions: list[UIAction] = []
    for _ in range(MAX_TOOL_ROUNDS):
        response = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=messages,
            tools=TOOLS,
        )
        choice = response.choices[0].message

        if not choice.tool_calls:
            return AssistantResponse(message=choice.content or "", actions=actions)

        messages.append(choice)
        for call in choice.tool_calls:
            args = json.loads(call.function.arguments or "{}")
            try:
                result = _execute_tool(creds, call.function.name, args, actions)
            except Exception as exc:  # surface tool failures to the model
                result = {"error": str(exc)}
            messages.append(
                {"role": "tool", "tool_call_id": call.id, "content": json.dumps(result)}
            )

    return AssistantResponse(
        message="I couldn't finish that in time — please try rephrasing.", actions=actions
    )
