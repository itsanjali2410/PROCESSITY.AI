"use client";

import { useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";

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
    return <p className="loading-screen">Loading…</p>;
  }

  if (!email) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>
            <span className="brand-dot" /> Processity Mail
          </h1>
          <p>Your inbox, driven by an AI copilot. Sign in to continue.</p>
          <a className="btn btn-primary" style={{ justifySelf: "center" }} href={`${API_URL}/auth/login`}>
            Sign in with Google
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
