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
    return <p style={{ padding: 32 }}>Loading…</p>;
  }

  if (!email) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
        <div style={{ textAlign: "center", display: "grid", gap: 16 }}>
          <h1>Processity Mail</h1>
          <p style={{ color: "#666" }}>AI-powered mail client. Sign in to continue.</p>
          <a
            href={`${API_URL}/auth/login`}
            style={{
              padding: "10px 24px",
              background: "#1a73e8",
              color: "#fff",
              borderRadius: 6,
              textDecoration: "none",
              justifySelf: "center",
            }}
          >
            Sign in with Google
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
