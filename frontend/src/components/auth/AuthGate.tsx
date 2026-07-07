"use client";

import { useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";

const FEATURES = [
  {
    title: "The AI drives the UI",
    text: "Say \"send an email to John about the meeting\" and watch the compose form fill itself in.",
  },
  {
    title: "Search in plain language",
    text: "\"Show unread emails from this week\" filters your real inbox, not a chat transcript.",
  },
  {
    title: "Always in sync",
    text: "New mail appears the moment it arrives. No refresh button, no waiting.",
  },
];

/**
 * Blocks the app until the user has authenticated with Google.
 * Auth state = the backend has valid OAuth tokens (checked via /auth/me).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((user) => setEmail(user.email))
      .catch(() => setEmail(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <p className="loading-screen">Loading</p>;
  }

  if (!email) {
    return (
      <div className="landing">
        <div className="landing-inner">
          <div className="brand landing-brand">
            <span className="brand-dot" />
            Processity Mail
          </div>
          <h1 className="landing-title">
            Your inbox, driven by an <em>AI copilot</em>.
          </h1>
          <p className="landing-sub">
            A mail client where the assistant does the clicking: it searches, filters, opens and
            drafts for you, right in the interface.
          </p>
          <a className="btn btn-primary landing-cta" href={`${API_URL}/auth/login`}>
            Sign in with Google
          </a>
          <div className="landing-features">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
