"use client";

import type { EmailFilters } from "@/lib/types";
import { toDateInput } from "@/lib/format";

export function FilterBar({
  filters,
  onChange,
}: {
  filters: EmailFilters;
  onChange: (filters: EmailFilters) => void;
}) {
  const hasFilters = Boolean(
    filters.query || filters.sender || filters.after || filters.before || filters.unread_only
  );

  return (
    <div className="filter-bar">
      <input
        placeholder="Search"
        value={filters.query ?? ""}
        onChange={(e) => onChange({ ...filters, query: e.target.value || undefined })}
      />
      <input
        placeholder="From (sender)"
        value={filters.sender ?? ""}
        onChange={(e) => onChange({ ...filters, sender: e.target.value || undefined })}
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
