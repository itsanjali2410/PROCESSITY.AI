"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { EmailDetail as EmailDetailType } from "@/lib/types";
import { formatFullDate, hueOf, senderAddress, senderName } from "@/lib/format";

export function EmailDetail({ emailId }: { emailId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState<EmailDetailType | null>(null);

  useEffect(() => {
    api.getEmail(emailId).then(setEmail).catch(console.error);
  }, [emailId]);

  if (!email) return <p className="loading-screen">Loading…</p>;

  const name = senderName(email.sender);
  const hue = hueOf(email.sender);
  const replyHref =
    `/compose?to=${encodeURIComponent(senderAddress(email.sender))}` +
    `&subject=${encodeURIComponent(`Re: ${email.subject}`)}` +
    `&reply_to=${encodeURIComponent(email.id)}`;

  return (
    <article className="detail">
      <button className="btn btn-ghost" onClick={() => router.back()}>
        Back
      </button>
      <h1>{email.subject}</h1>
      <div className="detail-meta">
        <span
          className="avatar"
          style={{ background: `hsl(${hue} 60% 88%)`, color: `hsl(${hue} 55% 30%)` }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="who">
          <div className="name">{name}</div>
          <div className="addr">{senderAddress(email.sender)}</div>
          <div className="when">{formatFullDate(email.date)}</div>
        </div>
        <button className="btn btn-primary" onClick={() => router.push(replyHref)}>
          Reply
        </button>
      </div>
      <div className="detail-body">
        {email.body_html ? (
          <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
        ) : (
          <pre>{email.body_text}</pre>
        )}
      </div>
    </article>
  );
}
