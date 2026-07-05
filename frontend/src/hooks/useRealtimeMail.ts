"use client";

import { useEffect } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/api/realtime/ws";

/** Subscribes to the backend websocket and fires the callback on new mail. */
export function useRealtimeMail(onNewEmail: () => void) {
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_email") onNewEmail();
    };
    return () => ws.close();
  }, [onNewEmail]);
}
