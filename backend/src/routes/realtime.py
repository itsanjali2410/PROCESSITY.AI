from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect

router = APIRouter()

# Connected frontend clients, keyed by user id
active_connections: dict[str, WebSocket] = {}


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Frontend connects here; we push 'new_email' events on Gmail webhooks."""
    await websocket.accept()
    # TODO: authenticate and register the connection per user
    try:
        while True:
            await websocket.receive_text()  # keepalive / ignore client messages
    except WebSocketDisconnect:
        pass  # TODO: unregister connection


@router.post("/gmail/webhook")
async def gmail_webhook(request: Request):
    """Google Pub/Sub push endpoint for Gmail watch() notifications."""
    # TODO: decode Pub/Sub message, fetch new messages via history API,
    # then broadcast to that user's websocket
    return {"ok": True}
