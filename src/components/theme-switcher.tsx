"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Theme = "light" | "dark" | "system";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = localStorage.getItem("prompt-chain-theme");
    const initial: Theme = saved === "light" || saved === "dark" ? saved : "system";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      document.documentElement.dataset.resolvedTheme =
        initial === "system" ? (media.matches ? "dark" : "light") : initial;
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    localStorage.setItem("prompt-chain-theme", next);
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.resolvedTheme =
      next === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : next;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-xl"
         role="group" aria-label="Color theme">
      {([
        ["light", Sun, "Light theme"],
        ["dark", Moon, "Dark theme"],
        ["system", Monitor, "System theme"],
      ] as const).map(([value, Icon, label]) => (
        <button key={value} type="button" aria-label={label} title={label}
          aria-pressed={theme === value} onClick={() => choose(value)}
          className={`rounded-lg p-2 transition-colors ${theme === value ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
          <Icon size={17} />
        </button>
      ))}
    </div>
  );
}
