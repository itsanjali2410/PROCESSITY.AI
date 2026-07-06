"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useRealtimeMail } from "@/hooks/useRealtimeMail";
import type { EmailFilters, EmailSummary } from "@/lib/types";
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

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ textTransform: "capitalize", marginBottom: 12 }}>{folder}</h1>
      <FilterBar filters={filters} onChange={setFilters} />
      {loading ? (
        <p>Loading…</p>
      ) : emails.length === 0 ? (
        <p>No emails.</p>
      ) : (
        <ul style={{ listStyle: "none" }}>
          {emails.map((email) => (
            <li
              key={email.id}
              onClick={() => router.push(`/email/${email.id}`)}
              style={{
                padding: "10px 8px",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                fontWeight: email.is_read ? 400 : 700,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{email.sender}</span>
                <span style={{ fontSize: 12, color: "#888" }}>
                  {new Date(email.date).toLocaleString()}
                </span>
              </div>
              <div>{email.subject}</div>
              <div style={{ fontSize: 13, color: "#666" }}>{email.preview}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
