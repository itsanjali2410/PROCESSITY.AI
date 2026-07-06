export interface EmailSummary {
  id: string;
  thread_id?: string;
  sender: string;
  subject: string;
  preview: string;
  date: string;
  is_read: boolean;
}

export interface EmailDetail extends EmailSummary {
  to: string[];
  body_html?: string;
  body_text?: string;
}

export interface EmailFilters {
  query?: string;
  sender?: string;
  after?: string;
  before?: string;
  unread_only?: boolean;
  folder?: "inbox" | "sent";
}

// Actions the assistant returns; the frontend executes them to drive the UI
export type UIAction =
  | { type: "navigate"; payload: { path: string } }
  | {
      type: "fill_compose";
      payload: { to?: string; subject?: string; body?: string; reply_to_message_id?: string };
    }
  | { type: "apply_filters"; payload: EmailFilters }
  | { type: "open_email"; payload: { email_id: string } }
  | { type: "send_email"; payload: Record<string, never> };

export interface AssistantResponse {
  message: string;
  actions: UIAction[];
}
