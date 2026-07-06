from src.models.schemas import UIAction
from src.services.ai_service import _execute_tool, _invalid_recipient


def test_valid_addresses_pass():
    assert _invalid_recipient({"to": "john@gmail.com"}) is None
    assert _invalid_recipient({"to": "anjali@processity.ai"}) is None
    assert _invalid_recipient({}) is None  # no recipient to validate


def test_partial_addresses_rejected():
    for bad in ("john", "john@", "john@gmail", "@gmail.com"):
        result = _invalid_recipient({"to": bad})
        assert result is not None and "error" in result


def test_fill_compose_records_ui_action():
    actions: list[UIAction] = []
    result = _execute_tool(
        None, "fill_compose", {"to": "a@b.com", "subject": "Hi", "body": "x"}, actions, False
    )
    assert result["ok"] is True
    assert actions[0].type == "fill_compose"


def test_send_blocked_on_first_turn():
    """Human-in-the-loop: sending requires a prior draft + confirmation turn."""
    result = _execute_tool(
        None, "send_email", {"to": "a@b.com", "subject": "Hi", "body": "x"}, [], False
    )
    assert "error" in result


def test_send_blocked_in_same_turn_as_draft():
    actions = [UIAction(type="fill_compose", payload={})]
    result = _execute_tool(
        None, "send_email", {"to": "a@b.com", "subject": "Hi", "body": "x"}, actions, True
    )
    assert "error" in result


def test_send_with_partial_address_rejected_before_send():
    result = _execute_tool(None, "send_email", {"to": "john@", "subject": "s", "body": "b"}, [], True)
    assert "error" in result and "complete email address" in result["error"]


def test_unknown_tool_reports_error():
    assert "error" in _execute_tool(None, "does_not_exist", {}, [], False)
