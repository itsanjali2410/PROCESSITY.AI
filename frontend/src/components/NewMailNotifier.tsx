"use client";

import { useEffect, useState } from "react";
import { useRealtimeMail } from "@/hooks/useRealtimeMail";

/**
 * App-wide new-mail alerts: an in-app toast on every view, plus a desktop
 * notification when the user has granted permission (asked once, on the
 * first click, since browsers require a user gesture).
 */
export function NewMailNotifier() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    const ask = () => {
      Notification.requestPermission().catch(() => {});
      window.removeEventListener("pointerdown", ask);
    };
    window.addEventListener("pointerdown", ask);
    return () => window.removeEventListener("pointerdown", ask);
  }, []);

  useRealtimeMail(() => {
    setVisible(true);
    setTimeout(() => setVisible(false), 4000);

    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      new Notification("Processity Mail", { body: "You received a new email" });
    }
  });

  if (!visible) return null;
  return <div className="toast">New email received</div>;
}
