"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/inbox", label: "Inbox" },
  { href: "/sent", label: "Sent" },
  { href: "/compose", label: "Compose" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    api.me().then((user) => setEmail(user.email)).catch(() => setEmail(null));
  }, []);

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      window.location.href = "/"; // AuthGate re-checks and shows the sign-in screen
    }
  }

  return (
    <nav className="sidebar">
      <div className="brand">
        <span className="brand-dot" />
        Processity Mail
      </div>
      {links.map(({ href, label }) => (
        <Link key={href} href={href} className={`nav-link ${pathname === href ? "active" : ""}`}>
          {label}
        </Link>
      ))}
      <div className="sidebar-footer">
        {email && <div className="user-email">{email}</div>}
        <ThemeToggle />
        <button className="logout-btn" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
