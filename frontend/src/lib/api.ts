import type { AssistantResponse, EmailDetail, EmailFilters, EmailSummary } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  listEmails: (filters: EmailFilters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][]
    );
    return request<EmailSummary[]>(`/api/emails/?${params}`);
  },

  getEmail: (id: string) => request<EmailDetail>(`/api/emails/${id}`),

  sendEmail: (payload: { to: string; subject: string; body: string; reply_to_message_id?: string }) =>
    request<{ ok: boolean }>("/api/emails/send", { method: "POST", body: JSON.stringify(payload) }),

  assistantChat: (payload: {
    messages: { role: "user" | "assistant"; content: string }[];
    current_view?: string;
    open_email_id?: string;
  }) =>
    request<AssistantResponse>("/api/assistant/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
