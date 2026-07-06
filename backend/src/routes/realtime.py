"""Real-time mail sync.

A background task polls Gmail for the newest inbox message id; when it
changes, every connected websocket client gets a `new_email` event and the
frontend refreshes. Polling (vs Pub/Sub push) keeps the demo fully local —
no public webhook URL or Cloud topic needed.
"""

import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from src.services import mail_service, token_store

router = APIRouter()
logger = logging.getLogger(__name__)

POLL_SECONDS = 15
connections: set[WebSocket] = set()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Frontend connects here; we push `new_email` events when mail arrives."""
    await websocket.accept()
    connections.add(websocket)
    try:
        while True:
            await websocket.receive_text()  # keepalive; client messages ignored
    except WebSocketDisconnect:
        pass
    finally:
        connections.discard(websocket)


async def _broadcast(payload: dict) -> None:
    for ws in list(connections):
        try:
            await ws.send_json(payload)
        except Exception:
            connections.discard(ws)


async def poll_inbox() -> None:
    """Watch the inbox for new messages while any client is connected."""
    last_seen_id: str | None = None
    while True:
        await asyncio.sleep(POLL_SECONDS)
        if not connections:
            last_seen_id = None  # re-baseline on next connect
            continue
        creds = token_store.load()
        if creds is None:
            continue
        try:
            latest = await asyncio.to_thread(mail_service.latest_inbox_message_id, creds)
        except Exception as exc:
            logger.warning("inbox poll failed: %s", exc)
            continue
        if latest and last_seen_id and latest != last_seen_id:
            await _broadcast({"type": "new_email"})
        if latest:
            last_seen_id = latest
