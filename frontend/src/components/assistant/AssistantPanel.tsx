"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { executeUIActions } from "@/lib/uiActions";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Show unread emails from this week",
  "Show me emails from the last 10 days",
  "Draft an email to someone@gmail.com",
];

const CHAT_STORAGE_KEY = "assistant-chat:v1";

export function AssistantPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Context awareness: derive current view + open email from the URL
  const openEmailId = pathname.startsWith("/email/") ? pathname.split("/")[2] : undefined;
  const currentView = openEmailId ? "email_detail" : pathname.replace("/", "") || "inbox";

  // Conversation survives page reloads
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {}
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  function clearChat() {
    setMessages([]);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {}
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    try {
      const res = await api.assistantChat({
        messages: nextMessages,
        current_view: currentView,
        open_email_id: openEmailId,
      });
      setMessages([...nextMessages, { role: "assistant", content: res.message.trim() }]);
      // This is where the assistant drives the UI
      executeUIActions(res.actions, router);
    } catch (err) {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="assistant">
      <header className="assistant-header">
        Assistant
        {messages.length > 0 && (
          <button className="chat-clear" onClick={clearChat}>
            Clear
          </button>
        )}
      </header>
      <div className="assistant-body">
        {messages.length === 0 && (
          <>
            <p className="assistant-hint">
              I can drive the app for you: search and filter your mail, open emails, draft
              replies, and send. Try one of these:
            </p>
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="typing">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        className="assistant-input"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          placeholder="Ask the assistant…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </aside>
  );
}
