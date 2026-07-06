from fastapi.testclient import TestClient

from src.core import deps
from src.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_protected_routes_require_auth(monkeypatch):
    monkeypatch.setattr(deps.token_store, "load", lambda: None)
    for path in ("/emails/?folder=inbox", "/emails/some-id", "/auth/me"):
        assert client.get(path).status_code == 401, path
    assert client.post("/assistant/chat", json={"messages": []}).status_code == 401


def test_send_rejects_invalid_recipient(monkeypatch):
    # Even authenticated, a malformed address must fail schema validation (422)
    monkeypatch.setattr(deps.token_store, "load", lambda: object())
    response = client.post(
        "/emails/send", json={"to": "not-an-email", "subject": "s", "body": "b"}
    )
    assert response.status_code == 422


def test_list_emails_rejects_bad_folder(monkeypatch):
    monkeypatch.setattr(deps.token_store, "load", lambda: object())
    assert client.get("/emails/?folder=spam").status_code == 422
