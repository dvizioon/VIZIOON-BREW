"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [turn, setTurn] = useState(0);

  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      className="inline-flex size-9 items-center justify-center rounded-xl text-[#f6efe6] hover:bg-white/10"
      aria-label={mounted && resolvedTheme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={() => {
        setTurn((value) => value + 1);
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }}
    >
      <span key={turn} className={turn ? "inline-flex animate__animated animate__rotateIn" : "inline-flex"}>
        {mounted && resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </span>
    </button>
  );
}
