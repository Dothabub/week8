"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/settings", label: "Profile & security" },
  { href: "/settings/members", label: "Members & permissions" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface-2 p-1 sm:inline-flex">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={pathname === t.href ? "page" : undefined}
          className={cn("whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition", pathname === t.href ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg")}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
