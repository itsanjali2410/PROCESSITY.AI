"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { invalidateCache, useCached } from "@/lib/cache";
import type { EmailDetail as EmailDetailType } from "@/lib/types";
import { formatFullDate, hueOf, senderAddress, senderName } from "@/lib/format";

function MessageBody({ message }: { message: EmailDetailType }) {
  return message.body_html ? (
    <div dangerouslySetInnerHTML={{ __html: message.body_html }} />
  ) : (
    <pre>{message.body_text}</pre>
  );
}

export function EmailDetail({ emailId }: { emailId: string }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: email } = useCached(`email:${emailId}`, () => api.getEmail(emailId));
  const threadId = email?.thread_id;
  const { data: thread = [] } = useCached(`thread:${threadId ?? "none"}`, () =>
    threadId ? api.getThread(threadId) : Promise.resolve([])
  );

  // Opening an email marks it read; refresh cached lists so unread state syncs
  useEffect(() => {
    api
      .markRead(emailId)
      .then(() => invalidateCache("emails:"))
      .catch(() => {});
  }, [emailId]);

  if (!email) return <p className="loading-screen">Loading</p>;

  // Conversation view: every message in the thread, older ones collapsed
  const messages = thread.length > 0 ? thread : [email];
  const isConversation = messages.length > 1;

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const replyTarget = messages[messages.length - 1];
  const replyHref =
    `/compose?to=${encodeURIComponent(senderAddress(replyTarget.sender))}` +
    `&subject=${encodeURIComponent(`Re: ${email.subject.replace(/^(\s*re:\s*)+/i, "")}`)}` +
    `&reply_to=${encodeURIComponent(replyTarget.id)}`;

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
      <h1>
        {email.subject}
        {isConversation && <span className="thread-count"> {messages.length} messages</span>}
      </h1>

      {messages.map((message, i) => {
        const name = senderName(message.sender);
        const hue = hueOf(message.sender);
        const isLast = i === messages.length - 1;
        const isOpen = !isConversation || isLast || expanded.has(message.id);

        return (
          <section key={message.id} className={`thread-msg ${isOpen ? "open" : ""}`}>
            <header
              className="thread-msg-head"
              onClick={() => isConversation && !isLast && toggle(message.id)}
            >
              <span
                className="avatar"
                style={{ background: `hsl(${hue} 60% 88%)`, color: `hsl(${hue} 55% 30%)` }}
              >
                {name.charAt(0).toUpperCase()}
              </span>
              <div className="who">
                <div className="name">{name}</div>
                {isOpen ? (
                  <div className="addr">{senderAddress(message.sender)}</div>
                ) : (
                  <div className="addr">{(message.body_text ?? "").slice(0, 90)}</div>
                )}
              </div>
              <div className="when">{formatFullDate(message.date)}</div>
            </header>
            {isOpen && (
              <div className="detail-body">
                <MessageBody message={message} />
              </div>
            )}
          </section>
        );
      })}
    </article>
  );
}
