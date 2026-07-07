"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

const TYPE_INTERVAL_MS = 18;
const CHARS_PER_TICK = 3;

function typeInto(setter: (value: string) => void, text: string): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    const timer = setInterval(() => {
      i = Math.min(i + CHARS_PER_TICK, text.length);
      setter(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        resolve();
      }
    }, TYPE_INTERVAL_MS);
  });
}

// The assistant pre-fills this form via query params (?to=&subject=&body=).
// Pre-filled values are typed in character by character, so the user visibly
// sees the assistant filling the form before they click Send.
export function ComposeForm() {
  const router = useRouter();
  const params = useSearchParams();
  const prefilled = {
    to: params.get("to") ?? "",
    subject: params.get("subject") ?? "",
    body: params.get("body") ?? "",
  };
  const hasPrefill = Boolean(prefilled.to || prefilled.subject || prefilled.body);

  const [to, setTo] = useState(hasPrefill ? "" : prefilled.to);
  const [subject, setSubject] = useState(hasPrefill ? "" : prefilled.subject);
  const [body, setBody] = useState(hasPrefill ? "" : prefilled.body);
  const [animating, setAnimating] = useState(hasPrefill);
  const replyTo = params.get("reply_to") ?? undefined;
  const [sending, setSending] = useState(false);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current) return;
    animated.current = true; // guard against React strict-mode double-run
    if (hasPrefill) {
      (async () => {
        await typeInto(setTo, prefilled.to);
        await typeInto(setSubject, prefilled.subject);
        await typeInto(setBody, prefilled.body);
        setAnimating(false);
      })();
      return;
    }
    // No prefill: restore an unsent draft after a reload
    try {
      const draft = sessionStorage.getItem("compose-draft");
      if (draft) {
        const { to, subject, body } = JSON.parse(draft);
        setTo(to ?? "");
        setSubject(subject ?? "");
        setBody(body ?? "");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the draft while typing; cleared on successful send
  useEffect(() => {
    if (animating) return;
    try {
      sessionStorage.setItem("compose-draft", JSON.stringify({ to, subject, body }));
    } catch {}
  }, [to, subject, body, animating]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await api.sendEmail({ to, subject, body, reply_to_message_id: replyTo });
      try {
        sessionStorage.removeItem("compose-draft");
      } catch {}
      router.push("/sent");
    } catch (err) {
      console.error(err);
      alert("Failed to send email");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="compose" onSubmit={handleSend}>
      <h1>{replyTo ? "Reply" : "Compose"}</h1>
      {animating && <p className="assist-note">Assistant is filling the form…</p>}
      <input placeholder="To" type="email" required value={to} onChange={(e) => setTo(e.target.value)} />
      <input placeholder="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea placeholder="Write something…" rows={12} required value={body} onChange={(e) => setBody(e.target.value)} />
      <div>
        <button type="submit" className="btn btn-primary" disabled={sending || animating}>
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
