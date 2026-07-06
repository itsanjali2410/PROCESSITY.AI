/** Display helpers so dates and senders render consistently everywhere. */

/** Smart date: time for today, "Mon 14:05" this week, "3 Jul" this year, else "3 Jul 2025". */
export function formatEmailDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAgo = (startOfToday.getTime() - date.getTime()) / 86_400_000;

  if (date >= startOfToday) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  if (daysAgo < 6) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Full timestamp for the detail view. */
export function formatFullDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Normalize any date-ish string (incl. full ISO datetimes) to YYYY-MM-DD for <input type="date">. */
export function toDateInput(value?: string): string {
  if (!value) return "";
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

/** "Jane Doe <jane@x.com>" -> "Jane Doe"; "jane@x.com" -> "jane" */
export function senderName(sender: string): string {
  const name = sender.replace(/<[^>]*>/g, "").replace(/["']/g, "").trim();
  if (name) return name;
  return sender.replace(/[<>]/g, "").split("@")[0] || sender;
}

/** "Jane Doe <jane@x.com>" -> "jane@x.com" */
export function senderAddress(sender: string): string {
  const match = sender.match(/<([^>]+)>/);
  return match ? match[1] : sender.trim();
}

/** Deterministic pastel hue per sender, for avatars. */
export function hueOf(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}
