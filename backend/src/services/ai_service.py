"""LLM orchestration for the assistant.

The model is given tool definitions; tool calls are translated into UIAction
objects the frontend executes (fill compose, apply filters, open email, ...).
"""

from src.models.schemas import AssistantRequest, AssistantResponse, UIAction

TOOLS = [
    {
        "name": "search_emails",
        "description": "Search/filter emails and show results in the main UI",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "sender": {"type": "string"},
                "after": {"type": "string", "description": "ISO date"},
                "before": {"type": "string", "description": "ISO date"},
                "unread_only": {"type": "boolean"},
                "folder": {"type": "string", "enum": ["inbox", "sent"]},
            },
        },
    },
    {
        "name": "fill_compose",
        "description": "Open the compose view and fill in the fields visibly",
        "input_schema": {
            "type": "object",
            "properties": {
                "to": {"type": "string"},
                "subject": {"type": "string"},
                "body": {"type": "string"},
            },
        },
    },
    {
        "name": "open_email",
        "description": "Navigate to and open a specific email in the detail view",
        "input_schema": {
            "type": "object",
            "properties": {"email_id": {"type": "string"}},
            "required": ["email_id"],
        },
    },
    {
        "name": "send_email",
        "description": "Send the currently composed email (ask for confirmation first)",
        "input_schema": {"type": "object", "properties": {}},
    },
]


def run(payload: AssistantRequest) -> AssistantResponse:
    # TODO:
    # 1. Build system prompt including payload.current_view / open_email_id
    # 2. Call Anthropic API with TOOLS, loop on tool_use blocks
    # 3. For search tools, actually query mail_service so results are real
    # 4. Map tool calls to UIAction objects and return them
    raise NotImplementedError
