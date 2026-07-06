"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useRealtimeMail } from "@/hooks/useRealtimeMail";
import type { EmailFilters, EmailSummary } from "@/lib/types";
import { formatEmailDate, hueOf, senderName } from "@/lib/format";
import { FilterBar } from "./FilterBar";

// Filters live in the URL query string, so both the FilterBar and the
// assistant's apply_filters action drive the list the same way.
export function EmailList({ folder }: { folder: "inbox" | "sent" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = useMemo<EmailFilters>(
    () => ({
      folder,
      query: searchParams.get("query") ?? undefined,
      sender: searchParams.get("sender") ?? undefined,
      after: searchParams.get("after") ?? undefined,
      before: searchParams.get("before") ?? undefined,
      unread_only: searchParams.get("unread_only") === "true" || undefined,
    }),
    [searchParams, folder]
  );

  const setFilters = (next: EmailFilters) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value !== undefined && value !== "" && key !== "folder") params.set(key, String(value));
    }
    router.replace(`${pathname}?${params}`);
  };

  const load = useCallback(() => {
    setLoading(true);
    api
      .listEmails(filters)
      .then(setEmails)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(load, [load]);
  useRealtimeMail(load); // new mail appears without manual refresh

  const unread = emails.filter((e) => !e.is_read).length;

  return (
    <div className="list-page">
      <div className="list-header">
        <h1>{folder}</h1>
        <span className="list-count">
          {loading ? "loading" : `${emails.length} emails${unread ? `, ${unread} unread` : ""}`}
        </span>
      </div>
      <FilterBar filters={filters} onChange={setFilters} />
      {!loading && emails.length === 0 ? (
        <div className="empty-state">Nothing here. Try clearing the filters.</div>
      ) : (
        <ul style={{ listStyle: "none" }}>
          {emails.map((email, i) => {
            const name = senderName(email.sender);
            const hue = hueOf(email.sender);
            return (
              <li
                key={email.id}
                className={`email-row ${email.is_read ? "" : "unread"}`}
                style={{ animationDelay: `${Math.min(i * 25, 300)}ms` }}
                onClick={() => router.push(`/email/${email.id}`)}
              >
                <span
                  className="avatar"
                  style={{ background: `hsl(${hue} 60% 88%)`, color: `hsl(${hue} 55% 30%)` }}
                >
                  {name.charAt(0).toUpperCase()}
                </span>
                <div className="email-main">
                  <div className="email-top">
                    <span className="email-sender">{name}</span>
                    <span className="email-date">{formatEmailDate(email.date)}</span>
                  </div>
                  <div className="email-subject">{email.subject}</div>
                  <div className="email-preview">{email.preview}</div>
                </div>
                {!email.is_read && <span className="unread-dot" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
