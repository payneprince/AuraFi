"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    document.body.className = "antialiased";
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <SessionProvider>
      <div className="antialiased">{children}</div>
    </SessionProvider>
  );
}
