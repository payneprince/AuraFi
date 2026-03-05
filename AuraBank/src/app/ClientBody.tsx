'use client';

import { useEffect } from "react";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.className = "antialiased";
  }, []);

  return <body className="antialiased">{children}</body>; // 👈 Changed from <div> to <body>
}