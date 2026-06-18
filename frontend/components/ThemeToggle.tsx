"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="theme-toggle"
      data-theme={theme}
    >
      {theme === "light" ? (
        <Sun size={18} className="theme-toggle-icon" aria-hidden />
      ) : (
        <Moon size={18} className="theme-toggle-icon" aria-hidden />
      )}
    </button>
  );
}
