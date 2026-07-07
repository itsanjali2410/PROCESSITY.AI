# Processity Mail

**Stack:** FastAPI (Python 3.13) · Next.js 15 (TypeScript) · Gmail API · any OpenAI-compatible LLM (Gemini by default)

## Demo



## Setup

### Prerequisites

- Python 3.13+ with [uv](https://docs.astral.sh/uv/), Node.js 20+
- A Google Cloud project with the **Gmail API enabled** and an **OAuth client** (type: Web application):
  - Authorized redirect URI: `http://localhost:8000/auth/callback`
  - OAuth consent screen in *Testing* mode — add your Gmail address as a **test user**
- An LLM API key — free options: [Google AI Studio](https://aistudio.google.com) or [Groq](https://console.groq.com)

### Backend

```bash
cd backend
cp .env.example .env        # fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, LLM_API_KEY
uv sync
uv run uvicorn src.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000, sign in with Google, and try the assistant:

- "Show unread emails from this week"
- "Send an email to name@gmail.com with subject Hello and body Hi there" — watch the compose form fill itself in
- Open any email and say "Reply to this"

### Tests

```bash
cd backend && uv run pytest
```

## Architecture

```
frontend/src/                      backend/src/
  components/   UI                   routes/      thin HTTP/WS layer
  lib/api.ts    backend client       services/
  lib/uiActions.ts  executes           mail_service.py   all Gmail logic
                assistant actions      ai_service.py     all LLM logic
  lib/cache.ts  stale-while-           token_store.py    OAuth tokens
                revalidate             core/        config, auth dependency
```

**How the assistant controls the UI.** The LLM gets five tools (`search_emails`, `get_email`, `open_email`, `fill_compose`, `send_email`). Executing them produces a list of `UIAction` objects returned to the frontend, which runs them — navigation, form fill (animated typing), filter application. Filters live in the URL query string, so the assistant and the manual filter controls drive the inbox through the same mechanism. The frontend sends the current view and open email id with every chat message, which is how "reply to this" works.

## Decisions & trade-offs

- **Provider-agnostic LLM.** The assistant speaks the OpenAI-compatible chat API, so switching Gemini → Groq → OpenAI is a `.env` change only.
- **Real-time sync via polling, not Pub/Sub.** Gmail push needs a public HTTPS webhook plus a Cloud Pub/Sub topic — unreasonable for a locally-run demo. A 15s backend poll broadcasting over websockets gives the same UX with zero infrastructure. `poll_inbox()` is the single function to replace if Pub/Sub is wanted later.
- **Human-in-the-loop sending, enforced server-side.** The model cannot call `send_email` in the same turn it drafts, or before the user has replied to a confirmation — guaranteed by code, not by prompt.
- **Single-user token store.** OAuth tokens live in a local file with auto-refresh. Right-sized for the demo; the store is isolated in one module so a DB/session-based version slots in without touching Gmail logic.
- **Two-layer cache.** Backend TTL cache over Gmail calls (lists 30s, immutable bodies 5min) plus frontend stale-while-revalidate, so navigation renders instantly. All caches invalidate on send, mark-read, and new-mail detection.
- **Recipient validation.** Incomplete addresses (`john`, `john@gmail`) are rejected at the tool layer; the assistant asks for the full address instead of guessing.

## Features

Inbox / Sent / detail views with real Gmail data · compose & threaded replies · filters (keyword, sender, date range, unread) via UI and natural language · context-aware assistant with visible form-filling and send confirmation · real-time new-mail toast · conversation/thread view · dark mode toggle · backend test suite

## What I'd improve with more time

- Gmail Pub/Sub push instead of polling
- Multi-user sessions (signed cookies, tokens in a DB)
- Streaming assistant responses; richer email-preview cards in the chat panel
- Pagination for large mailboxes; attachment support
- Frontend component tests and an E2E happy path (Playwright)
