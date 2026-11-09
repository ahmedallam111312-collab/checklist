"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { AR_STRINGS } from "@/messages/ar";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentTheme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("profnurse-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("profnurse-theme", "dark");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={AR_STRINGS.toggleTheme}
      title={AR_STRINGS.toggleTheme}
      className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-transform hover:text-[var(--color-primary)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
    >
      {mounted && theme === "light" ? (
        <Moon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Sun className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
