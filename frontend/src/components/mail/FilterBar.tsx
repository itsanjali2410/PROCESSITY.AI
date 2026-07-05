"use client";

import type { EmailFilters } from "@/lib/types";

export function FilterBar({
  filters,
  onChange,
}: {
  filters: EmailFilters;
  onChange: (filters: EmailFilters) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
      <input
        placeholder="Search…"
        value={filters.query ?? ""}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
      />
      <input
        placeholder="From (sender)"
        value={filters.sender ?? ""}
        onChange={(e) => onChange({ ...filters, sender: e.target.value })}
      />
      <input
        type="date"
        value={filters.after ?? ""}
        onChange={(e) => onChange({ ...filters, after: e.target.value })}
      />
      <input
        type="date"
        value={filters.before ?? ""}
        onChange={(e) => onChange({ ...filters, before: e.target.value })}
      />
      <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          type="checkbox"
          checked={filters.unread_only ?? false}
          onChange={(e) => onChange({ ...filters, unread_only: e.target.checked })}
        />
        Unread only
      </label>
    </div>
  );
}
