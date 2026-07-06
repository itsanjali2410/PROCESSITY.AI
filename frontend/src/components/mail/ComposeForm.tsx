"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

// The assistant pre-fills this form via query params (?to=&subject=&body=)
// so the user can watch the fields fill in before sending.
export function ComposeForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [to, setTo] = useState(params.get("to") ?? "");
  const [subject, setSubject] = useState(params.get("subject") ?? "");
  const [body, setBody] = useState(params.get("body") ?? "");
  const replyTo = params.get("reply_to") ?? undefined;
  const [sending, setSending] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await api.sendEmail({ to, subject, body, reply_to_message_id: replyTo });
      router.push("/sent");
    } catch (err) {
      console.error(err);
      alert("Failed to send email");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSend} style={{ padding: 16, display: "grid", gap: 12, maxWidth: 640 }}>
      <h1>Compose</h1>
      <input placeholder="To" type="email" required value={to} onChange={(e) => setTo(e.target.value)} />
      <input placeholder="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea placeholder="Body" rows={12} required value={body} onChange={(e) => setBody(e.target.value)} />
      <button type="submit" disabled={sending}>
        {sending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
