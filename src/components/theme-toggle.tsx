"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Prevents the button from turning invisible on first load
  if (!mounted) {
    return (
      <div className="w-[42px] h-[42px] rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 shadow-lg"></div>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:scale-110 shadow-lg hover:shadow-[0_8px_20px_rgba(5,150,105,0.15)] active:scale-95 transition-all duration-300 group"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 group-hover:text-emerald-400 transition-colors" />
      ) : (
        <Moon className="w-5 h-5 group-hover:text-emerald-600 transition-colors" />
      )}
    </button>
  );
}
