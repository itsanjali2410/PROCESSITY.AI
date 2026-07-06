import type { AssistantResponse, EmailDetail, EmailFilters, EmailSummary } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  me: () => request<{ email: string }>("/auth/me"),

  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  listEmails: (filters: EmailFilters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][]
    );
    return request<EmailSummary[]>(`/emails/?${params}`);
  },

  getEmail: (id: string) => request<EmailDetail>(`/emails/${id}`),

  getThread: (threadId: string) => request<EmailDetail[]>(`/emails/thread/${threadId}`),

  markRead: (id: string) => request<{ ok: boolean }>(`/emails/${id}/read`, { method: "POST" }),

  sendEmail: (payload: { to: string; subject: string; body: string; reply_to_message_id?: string }) =>
    request<{ id: string }>("/emails/send", { method: "POST", body: JSON.stringify(payload) }),

  assistantChat: (payload: {
    messages: { role: "user" | "assistant"; content: string }[];
    current_view?: string;
    open_email_id?: string;
  }) =>
    request<AssistantResponse>("/assistant/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
