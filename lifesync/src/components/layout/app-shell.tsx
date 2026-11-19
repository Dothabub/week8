"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Ellipsis, LogOut, PanelLeftClose, PanelLeftOpen, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { NAV_ITEMS, isActive } from "./nav";
import { ThemeToggle, type ThemePref } from "./theme";
import { SIDEBAR_COOKIE } from "@/lib/constants";

export interface ShellUser { id: string; name: string; email: string; role: "ADMIN" | "MEMBER"; hasAvatar: boolean; avatarVersion?: string }


export function AppShell({
  user, householdName, theme, onTheme, onSignOut, initialCollapsed = false, children,
}: {
  user: ShellUser; householdName: string; theme: ThemePref; initialCollapsed?: boolean;
  onTheme: (p: ThemePref) => Promise<void>; onSignOut: () => Promise<void>; children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => setMoreOpen(false), [pathname]);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    // UI preference only (not sensitive); a cookie lets the server render the right width.
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  }

  const primary = NAV_ITEMS.filter((n) => n.mobilePrimary);
  const secondary = NAV_ITEMS.filter((n) => !n.mobilePrimary);
  const moreActive = secondary.some((n) => isActive(pathname, n.href));

  return (
    <div className="min-h-dvh bg-bg">
      {/* ── Desktop / tablet sidebar ─────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex",
          collapsed ? "w-[72px]" : "w-[248px]",
        )}
        aria-label="Main navigation"
      >
        <div className={cn("flex h-16 items-center gap-2.5 px-4", collapsed && "justify-center px-0")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <Sparkles className="h-4.5 w-4.5" aria-hidden />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[15px] font-semibold tracking-tight text-fg">LifeSync</div>
              <div className="truncate text-[11px] text-subtle">{householdName}</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={collapsed ? label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex h-9 items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition",
                      collapsed && "justify-center px-0",
                      active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {collapsed && <span className="sr-only">{label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-3 space-y-2">
          {!collapsed && <ThemeToggle initial={theme} onPersist={onTheme} compact />}
          <div className={cn("flex items-center gap-2.5 rounded-xl p-1.5", collapsed && "justify-center")}>
            <Avatar name={user.name} userId={user.id} hasImage={user.hasAvatar} version={user.avatarVersion} size={30} />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-fg">{user.name}</div>
                <div className="truncate text-[11px] text-subtle">{user.role === "ADMIN" ? "Admin" : "Member"}</div>
              </div>
            )}
            {!collapsed && (
              <form action={onSignOut}>
                <button type="submit" title="Sign out" className="rounded-lg p-1.5 text-subtle hover:bg-surface-2 hover:text-fg">
                  <LogOut className="h-4 w-4" aria-hidden /><span className="sr-only">Sign out</span>
                </button>
              </form>
            )}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={cn("flex h-8 w-full items-center gap-2 rounded-lg px-2 text-[12px] text-subtle hover:bg-surface-2 hover:text-fg", collapsed && "justify-center")}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" />Collapse</>}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface/85 px-4 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <Sparkles className="h-4 w-4" aria-hidden />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">LifeSync</span>
        </div>
        <Link href="/settings" aria-label="Profile and settings">
          <Avatar name={user.name} userId={user.id} hasImage={user.hasAvatar} version={user.avatarVersion} size={30} />
        </Link>
      </header>

      {/* ── Content ──────────────────────────────────────────────── */}
      <main className={cn("transition-[padding] duration-200", collapsed ? "md:pl-[72px]" : "md:pl-[248px]")}>
        <div className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-5 sm:px-6 md:pb-10 md:pt-8 lg:px-10">{children}</div>
      </main>

      {/* ── Mobile bottom navigation ─────────────────────────────── */}
      <nav aria-label="Main navigation" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {primary.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-medium", active ? "text-accent" : "text-subtle")}>
                  <Icon className="h-5 w-5" aria-hidden />
                  <span className="max-w-full truncate px-1">{label.replace("Weekly ", "")}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMoreOpen(true)} aria-haspopup="dialog" aria-expanded={moreOpen} className={cn("flex h-16 w-full flex-col items-center justify-center gap-1 text-[10.5px] font-medium", moreActive ? "text-accent" : "text-subtle")}>
              <Ellipsis className="h-5 w-5" aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="pb-safe absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-surface p-4 shadow-pop">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">More</span>
              <button type="button" onClick={() => setMoreOpen(false)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <ul className="grid grid-cols-3 gap-2">
              {secondary.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} className={cn("flex flex-col items-center gap-1.5 rounded-2xl border border-border p-3 text-center text-[12px] font-medium", isActive(pathname, href) ? "bg-accent-soft text-accent" : "text-fg")}>
                    <Icon className="h-5 w-5" aria-hidden />{label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between gap-2">
              <ThemeToggle initial={theme} onPersist={onTheme} />
              <form action={onSignOut}>
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium text-muted hover:bg-surface-2"><LogOut className="h-4 w-4" />Sign out</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
