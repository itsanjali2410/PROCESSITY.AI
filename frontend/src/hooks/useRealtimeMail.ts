"use client";

import { useEffect, useRef } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/realtime/ws";
const RECONNECT_MS = 5000;

/** Subscribes to the backend websocket and fires the callback on new mail. */
export function useRealtimeMail(onNewEmail: () => void) {
  const callback = useRef(onNewEmail);
  callback.current = onNewEmail;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout>;
    let closed = false;

    function connect() {
      ws = new WebSocket(WS_URL);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "new_email") callback.current();
      };
      ws.onclose = () => {
        if (!closed) timer = setTimeout(connect, RECONNECT_MS);
      };
    }

    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, []);
}
