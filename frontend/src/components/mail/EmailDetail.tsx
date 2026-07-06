"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { EmailDetail as EmailDetailType } from "@/lib/types";
import { formatFullDate, hueOf, senderAddress, senderName } from "@/lib/format";

function MessageBody({ email }: { email: EmailDetailType }) {
  return email.body_html ? (
    <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
  ) : (
    <pre>{email.body_text}</pre>
  );
}

// Conversation view: shows the whole Gmail thread, oldest first.
// Earlier messages are collapsed; the opened email is expanded.
export function EmailDetail({ emailId }: { emailId: string }) {
  const router = useRouter();
  const [thread, setThread] = useState<EmailDetailType[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const email = await api.getEmail(emailId);
        const messages = email.thread_id ? await api.getThread(email.thread_id) : [email];
        if (cancelled) return;
        setThread(messages);
        setExpanded(new Set([emailId, messages[messages.length - 1]?.id]));
        api.markRead(emailId).catch(() => {});
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [emailId]);

  if (loading) return <p className="loading-screen">Loading…</p>;
  if (thread.length === 0) return <p className="loading-screen">Email not found.</p>;

  const subject = thread[0].subject;
  const last = thread[thread.length - 1];
  const replyHref =
    `/compose?to=${encodeURIComponent(senderAddress(last.sender))}` +
    `&subject=${encodeURIComponent(subject.startsWith("Re:") ? subject : `Re: ${subject}`)}` +
    `&reply_to=${encodeURIComponent(last.id)}`;

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <article className="detail">
      <div className="detail-toolbar">
        <button className="btn btn-ghost" onClick={() => router.back()}>
          Back
        </button>
        <button className="btn btn-primary" onClick={() => router.push(replyHref)}>
          Reply
        </button>
      </div>
      <h1>{subject}</h1>
      {thread.length > 1 && (
        <p className="thread-count">{thread.length} messages in this conversation</p>
      )}
      <div className="thread">
        {thread.map((message) => {
          const name = senderName(message.sender);
          const hue = hueOf(message.sender);
          const isOpen = expanded.has(message.id) || thread.length === 1;
          return (
            <section key={message.id} className={`thread-msg ${isOpen ? "open" : ""}`}>
              <header className="thread-msg-head" onClick={() => toggle(message.id)}>
                <span
                  className="avatar"
                  style={{ background: `hsl(${hue} 60% 88%)`, color: `hsl(${hue} 55% 30%)` }}
                >
                  {name.charAt(0).toUpperCase()}
                </span>
                <div className="who">
                  <div className="name">{name}</div>
                  {isOpen ? (
                    <div className="addr">
                      {senderAddress(message.sender)}
                      {message.to.length > 0 && ` to ${message.to.join(", ")}`}
                    </div>
                  ) : (
                    <div className="addr">{message.preview}</div>
                  )}
                </div>
                <span className="when">{formatFullDate(message.date)}</span>
              </header>
              {isOpen && (
                <div className="detail-body">
                  <MessageBody email={message} />
                </div>
              )}
            </section>
          );
        })}
      </div>
    </article>
  );
}
