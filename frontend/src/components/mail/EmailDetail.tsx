"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { EmailDetail as EmailDetailType } from "@/lib/types";

export function EmailDetail({ emailId }: { emailId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState<EmailDetailType | null>(null);

  useEffect(() => {
    api.getEmail(emailId).then(setEmail).catch(console.error);
  }, [emailId]);

  if (!email) return <p style={{ padding: 16 }}>Loading…</p>;

  return (
    <article style={{ padding: 16 }}>
      <h1>{email.subject}</h1>
      <p style={{ color: "#666", margin: "8px 0" }}>
        From {email.sender} · {new Date(email.date).toLocaleString()}
      </p>
      <button
        onClick={() =>
          router.push(
            `/compose?to=${encodeURIComponent(email.sender)}&subject=${encodeURIComponent(
              `Re: ${email.subject}`
            )}`
          )
        }
      >
        Reply
      </button>
      <hr style={{ margin: "16px 0" }} />
      {email.body_html ? (
        <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
      ) : (
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{email.body_text}</pre>
      )}
    </article>
  );
}
