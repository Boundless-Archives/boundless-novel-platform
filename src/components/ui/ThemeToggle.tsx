"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const dark = resolvedTheme === "dark";

  return (
    <button
      onClick={() =>
        setTheme(dark ? "light" : "dark")
      }
      className="
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-full
        border
        transition-all
        hover:scale-105
      "
      style={{
        borderColor: "var(--card-border)",
        backgroundColor: "var(--card)",
      }}
      aria-label="Toggle theme"
    >
      {dark ? (
        <Sun size={20} />
      ) : (
        <Moon size={20} />
      )}
    </button>
  );
}