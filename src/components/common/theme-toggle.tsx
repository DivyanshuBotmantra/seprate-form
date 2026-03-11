// src/components/ThemeToggle.tsx
import { useTheme } from "@/contexts/theme-provider";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(theme === "dark");

  useEffect(() => {
    setIsDark(theme === "dark");
  }, [theme]);

  const handleToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    setIsDark((prev) => !prev);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        relative inline-flex h-8 w-16 rounded-full transition-colors duration-300 focus:outline-none
        bg-white/10 backdrop-blur-md border border-white/20 shadow-lg
      `}
      aria-label="Toggle Theme"
    >
      <span
        className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white/40 backdrop-blur-sm border border-white/30 shadow-md flex items-center justify-center transition-transform duration-300 ${
          isDark ? "translate-x-8" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon size={16} className="text-zinc-800" />
        ) : (
          <Sun size={16} className="text-yellow-500" />
        )}
      </span>
    </button>
  );
}
