import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/mail/Sidebar";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { AuthGate } from "@/components/auth/AuthGate";

export const metadata: Metadata = {
  title: "Processity Mail",
  description: "AI-powered mail client where the assistant controls the UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthGate>
          <div className="app-shell">
            <Sidebar />
            <main className="main-view">{children}</main>
            <AssistantPanel />
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
