"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/inbox", label: "Inbox" },
  { href: "/sent", label: "Sent" },
  { href: "/compose", label: "Compose" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Mail</h2>
      <ul style={{ listStyle: "none", display: "grid", gap: 8 }}>
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} style={{ fontWeight: pathname === href ? 700 : 400 }}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
