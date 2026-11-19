"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/cn";

export type ThemePref = "system" | "light" | "dark";
const KEY = "lifesync-theme";

/** Inline script (runs before paint) to avoid a light/dark flash. */
export const themeInitScript = `(function(){try{var p=document.documentElement.dataset.pref||localStorage.getItem("${KEY}")||"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){}})();`;

function apply(pref: ThemePref) {
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.pref = pref;
}

export function ThemeToggle({ initial, onPersist, compact }: { initial: ThemePref; onPersist?: (p: ThemePref) => Promise<void>; compact?: boolean }) {
  const [pref, setPref] = useState<ThemePref>(initial);
  const [, start] = useTransition();

  useEffect(() => {
    if (pref !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const fn = () => apply("system");
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [pref]);

  function choose(p: ThemePref) {
    setPref(p);
    apply(p);
    try { localStorage.setItem(KEY, p); } catch {}
    if (onPersist) start(() => onPersist(p));
  }

  const opts: { v: ThemePref; icon: typeof Sun; label: string }[] = [
    { v: "light", icon: Sun, label: "Light" },
    { v: "dark", icon: Moon, label: "Dark" },
    { v: "system", icon: Monitor, label: "System" },
  ];
  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-xl border border-border bg-surface-2 p-0.5">
      {opts.map(({ v, icon: Icon, label }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={pref === v}
          title={label}
          onClick={() => choose(v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[12px] font-medium transition",
            pref === v ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {!compact && label}
          {compact && <span className="sr-only">{label}</span>}
        </button>
      ))}
    </div>
  );
}
