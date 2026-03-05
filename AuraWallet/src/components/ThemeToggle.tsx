"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('aurawallet_theme');
    if (savedTheme === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
      return;
    }
    if (savedTheme === 'light') {
      setDark(false);
      document.documentElement.classList.remove('dark');
      return;
    }

    const hasDarkClass = document.documentElement.classList.contains('dark');
    setDark(hasDarkClass);
  }, []);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('aurawallet_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={() => setDark(d => !d)}
      className="px-2 py-1 rounded border border-slate-300 bg-white text-slate-900 dark:bg-white/5 dark:text-white dark:border-white/15 flex items-center gap-1.5"
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {dark ? 'Light' : 'Dark'}
    </button>
  );
}
