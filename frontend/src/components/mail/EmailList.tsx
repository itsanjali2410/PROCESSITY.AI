"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useRealtimeMail } from "@/hooks/useRealtimeMail";
import type { EmailFilters, EmailSummary } from "@/lib/types";
import { FilterBar } from "./FilterBar";

export function EmailList({ folder }: { folder: "inbox" | "sent" }) {
  const router = useRouter();
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [filters, setFilters] = useState<EmailFilters>({ folder });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listEmails({ ...filters, folder })
      .then(setEmails)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, folder]);

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
