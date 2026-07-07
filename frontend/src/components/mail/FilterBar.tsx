"use client";

import { useEffect, useState } from "react";
import type { EmailFilters } from "@/lib/types";
import { toDateInput } from "@/lib/format";

const DEBOUNCE_MS = 350;

export function FilterBar({
  filters,
  onChange,
}: {
  filters: EmailFilters;
  onChange: (filters: EmailFilters) => void;
}) {
  // Text inputs are typed locally and synced to the URL debounced — driving
  // them straight from the URL drops keystrokes (router updates are async)
  // and fires one Gmail search per keypress.
  const [query, setQuery] = useState(filters.query ?? "");
  const [sender, setSender] = useState(filters.sender ?? "");

  // External changes (assistant filters, Clear button) update the fields
  useEffect(() => {
    setQuery(filters.query ?? "");
    setSender(filters.sender ?? "");
  }, [filters.query, filters.sender]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextQuery = query.trim() || undefined;
      const nextSender = sender.trim() || undefined;
      if (nextQuery !== filters.query || nextSender !== filters.sender) {
        onChange({ ...filters, query: nextQuery, sender: nextSender });
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sender]);

  const hasFilters = Boolean(
    filters.query || filters.sender || filters.after || filters.before || filters.unread_only
  );

  return (
    <div className="filter-bar">
      <input
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <input
        placeholder="From (sender)"
        value={sender}
        onChange={(e) => setSender(e.target.value)}
      />
      <input
        type="date"
        title="From date"
        value={toDateInput(filters.after)}
        onChange={(e) => onChange({ ...filters, after: e.target.value || undefined })}
      />
      <input
        type="date"
        title="To date"
        value={toDateInput(filters.before)}
        onChange={(e) => onChange({ ...filters, before: e.target.value || undefined })}
      />
      <label className="filter-check">
        <input
          type="checkbox"
          checked={filters.unread_only ?? false}
          onChange={(e) => onChange({ ...filters, unread_only: e.target.checked || undefined })}
        />
        Unread
      </label>
      {hasFilters && (
        <button className="btn btn-ghost" onClick={() => onChange({ folder: filters.folder })}>
          Clear
        </button>
      )}
    </div>
  );
}
