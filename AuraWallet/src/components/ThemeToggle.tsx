"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() => typeof window !== 'undefined' && document.documentElement.classList.contains('dark'));

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  return (
    <button onClick={() => setDark(d => !d)} className="px-2 py-1 rounded bg-white/5 text-white">
      {dark ? 'Light' : 'Dark'}
    </button>
  );
}
