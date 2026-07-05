"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { executeUIActions } from "@/lib/uiActions";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AssistantPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  // Context awareness: derive current view + open email from the URL
  const openEmailId = pathname.startsWith("/email/") ? pathname.split("/")[2] : undefined;
  const currentView = openEmailId ? "email_detail" : pathname.replace("/", "") || "inbox";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    try {
      const res = await api.assistantChat({
        messages: nextMessages,
        current_view: currentView,
        open_email_id: openEmailId,
      });
      setMessages([...nextMessages, { role: "assistant", content: res.message }]);
      // This is where the assistant drives the UI
      executeUIActions(res.actions, router);
    } catch (err) {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#fafafa",
      }}
    >
      <header style={{ padding: 12, borderBottom: "1px solid #e5e5e5", fontWeight: 600 }}>
        AI Assistant
      </header>
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "grid", gap: 8, alignContent: "start" }}>
        {messages.length === 0 && (
          <p style={{ color: "#888", fontSize: 13 }}>
            Try: “Send an email to john@example.com about the meeting” or “Show unread emails from
            this week”.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              justifySelf: m.role === "user" ? "end" : "start",
              background: m.role === "user" ? "#1a73e8" : "#fff",
              color: m.role === "user" ? "#fff" : "#222",
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: "8px 10px",
              maxWidth: "85%",
              fontSize: 14,
              whiteSpace: "pre-wrap",
            }}
          >
            {m.content}
          </div>
        ))}
        {busy && <p style={{ color: "#888", fontSize: 13 }}>Thinking…</p>}
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #e5e5e5" }}>
        <input
          style={{ flex: 1 }}
          placeholder="Ask the assistant…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button type="submit" disabled={busy}>
          Send
        </button>
      </form>
    </aside>
  );
}
