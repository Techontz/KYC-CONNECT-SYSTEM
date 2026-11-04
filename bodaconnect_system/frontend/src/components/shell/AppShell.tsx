"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ExternalLink, LogOut, Menu, Search } from "lucide-react";
import { useI18n, type MessageKey } from "@/i18n";
import { api } from "@/lib/api";
import { useMe } from "@/lib/hooks";
import { hasRole, isStaff, navFor, primaryOrganisation, primaryRole, type NavItem } from "@/lib/roles";
import type { ListResponse, Me, Notification } from "@/lib/types";
import { personName } from "@/lib/format";
import { Drawer, ErrorState, IconButton, Skeleton, cn } from "@/components/ui";
import { Logo } from "./Logo";
import { LanguageSelect } from "@/components/common/LanguageSelect";
import { NAV_ICONS } from "./navIcons";

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3000";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/riders") return pathname === "/riders" || (pathname.startsWith("/riders/") && !pathname.startsWith("/riders/new"));
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

async function signOut(clear: () => void) {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    clear();
    window.location.assign("/login");
  }
}

function useUnreadCount(enabled: boolean) {
  const q = useQuery({
    queryKey: ["/notifications", { perPage: 50 }],
    queryFn: () => api<ListResponse<Notification>>("/notifications", { query: { perPage: 50 } }),
    enabled,
    refetchInterval: 120_000,
  });
  return q.data?.meta?.unread ?? (q.data?.data ?? []).filter((n) => !n.readAt).length;
}

function UserCard({ me, dark }: { me: Me; dark?: boolean }) {
  const { t, tx } = useI18n();
  const role = primaryRole(me);
  const org = primaryOrganisation(me);
  const name = me.displayName || (personName(me.person) !== "-" ? personName(me.person) : me.phoneE164);
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className={cn("flex items-center gap-3 rounded-[16px] p-3", dark ? "bg-white/5" : "bg-surface")}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white" aria-hidden>
        {initials || "?"}
      </span>
      <div className="min-w-0">
        <p className={cn("truncate text-sm font-bold", dark ? "text-white" : "text-ink")}>{name}</p>
        <p className={cn("truncate text-xs", dark ? "text-mint/80" : "text-muted")}>
          {role ? tx(`role.${role}`, role) : t("role.none")}
          {org?.name ? ` · ${org.name}` : ""}
        </p>
      </div>
    </div>
  );
}

function NavList({ items, pathname, dark, onNavigate }: { items: NavItem[]; pathname: string; dark?: boolean; onNavigate?: () => void }) {
  const { t } = useI18n();
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((it) => {
        const Icon = NAV_ICONS[it.key];
        const active = isActive(pathname, it.href);
        return (
          <li key={it.key}>
            <Link
              href={it.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-[15px] font-semibold transition-colors",
                dark
                  ? active
                    ? "bg-white/10 text-white"
                    : "text-white/75 hover:bg-white/5 hover:text-white"
                  : active
                    ? "bg-mint-50 text-forest"
                    : "text-ink hover:bg-surface",
              )}
            >
              <Icon className={cn("size-5 shrink-0", active ? "text-brand" : dark ? "text-white/60" : "text-muted")} aria-hidden />
              {t(it.label)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Sidebar({ me, items, pathname }: { me: Me; items: NavItem[]; pathname: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-forest px-4 py-5 lg:flex" aria-label={t("nav.main")}>
      <Link href="/" className="mb-6 px-2">
        <Logo dark />
      </Link>
      <nav className="-mx-1 flex-1 overflow-y-auto px-1" aria-label={t("nav.main")}>
        <NavList items={items} pathname={pathname} dark />
      </nav>
      <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
        <a href={LANDING_URL} className="flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-sm font-medium text-white/75 hover:bg-white/5 hover:text-white">
          <ExternalLink className="size-4" aria-hidden /> {t("nav.landing")}
        </a>
        <UserCard me={me} dark />
        <button
          type="button"
          onClick={() => signOut(() => qc.clear())}
          className="flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-sm font-semibold text-white/80 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4" aria-hidden /> {t("nav.signOut")}
        </button>
      </div>
    </aside>
  );
}

function TopBar({ me, staff, onMenu }: { me: Me; staff: boolean; onMenu: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const qc = useQueryClient();
  const unread = useUnreadCount(true);
  const [q, setQ] = useState("");
  const canSearch = staff && hasRole(me, "platform_admin", "verifier", "field_agent", "association_admin", "group_leader");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/riders?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Link href="/" className={cn(staff ? "lg:hidden" : "")} aria-label="BodaConnect OS">
          <Logo className="[&>span:last-child]:hidden min-[400px]:[&>span:last-child]:inline" />
        </Link>
        {canSearch && (
          <form onSubmit={submit} role="search" className="ml-2 hidden max-w-md flex-1 md:block">
            <label htmlFor="global-search" className="sr-only">
              {t("search.label")}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="global-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("search.placeholder")}
                className="min-h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/20"
              />
            </div>
          </form>
        )}
        <div className="ml-auto flex items-center gap-1">
          {!staff && (
            <nav className="mr-2 hidden items-center gap-1 lg:flex" aria-label={t("nav.main")}>
              {navFor(me).map((it) => (
                <Link key={it.key} href={it.href} className="rounded-full px-3 py-2 text-sm font-semibold text-ink hover:bg-surface">
                  {t(it.label)}
                </Link>
              ))}
            </nav>
          )}
          <div className="hidden sm:block">
            <LanguageSelect />
          </div>
          <Link
            href="/notices"
            aria-label={unread ? t("nav.noticesUnread", { count: unread }) : t("nav.notices")}
            className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-mint-50"
          >
            <Bell className="size-5" aria-hidden />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 min-w-5 rounded-full bg-danger px-1 text-center text-[11px] leading-5 font-bold text-white" aria-hidden>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <IconButton label={t("nav.signOut")} onClick={() => signOut(() => qc.clear())} className="hidden lg:inline-flex">
            <LogOut className="size-5" aria-hidden />
          </IconButton>
          <IconButton label={t("nav.more")} onClick={onMenu} className="lg:hidden">
            <Menu className="size-5" aria-hidden />
          </IconButton>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ items, pathname, onMore, me }: { items: NavItem[]; pathname: string; onMore: () => void; me: Me }) {
  const { t } = useI18n();
  const pick = (...keys: NavItem["key"][]) => keys.map((k) => items.find((i) => i.key === k)).find(Boolean);
  const slots = [
    pick("home"),
    isStaff(me) ? pick("riders", "verification") : pick("me"),
    isStaff(me) ? pick("register", "verification", "duplicates", "organisation") : pick("vehicles"),
    pick("notices"),
  ].filter((x): x is NavItem => Boolean(x));
  const unique = slots.filter((s, i) => slots.findIndex((x) => x.key === s.key) === i);
  return (
    <nav aria-label={t("nav.mobile")} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-safe lg:hidden">
      <ul className="mx-auto grid grid-cols-1 max-w-lg" style={{ gridTemplateColumns: `repeat(${unique.length + 1}, minmax(0, 1fr))` }}>
        {unique.map((it) => {
          const Icon = NAV_ICONS[it.key];
          const active = isActive(pathname, it.href);
          const short: Record<string, MessageKey> = { register: "nav.registerShort", me: "nav.meShort", verification: "nav.verificationShort" };
          return (
            <li key={it.key}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", active ? "text-forest" : "text-muted")}
              >
                <span className={cn("flex h-7 w-12 items-center justify-center rounded-full", active && "bg-mint")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="max-w-full truncate px-1">{t(short[it.key] ?? it.label)}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={onMore} className="flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted">
            <span className="flex h-7 w-12 items-center justify-center rounded-full">
              <Menu className="size-5" aria-hidden />
            </span>
            {t("nav.more")}
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const me = useMe();
  const qc = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  if (me.isPending) {
    return (
      <div className="min-h-dvh bg-surface" role="status" aria-live="polite">
        <span className="sr-only">{t("common.loading")}</span>
        <div className="hidden w-72 bg-forest lg:fixed lg:inset-y-0 lg:block" />
        <div className="mx-auto max-w-5xl p-6 lg:pl-80">
          <Skeleton className="mb-6 h-10 w-64" />
          <Skeleton className="mb-4 h-32 w-full rounded-[20px]" />
          <Skeleton className="h-64 w-full rounded-[20px]" />
        </div>
      </div>
    );
  }
  if (me.isError || !me.data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface p-4">
        <ErrorState error={me.error} onRetry={() => me.refetch()} className="max-w-lg" />
      </div>
    );
  }

  const user = me.data;
  const staff = isStaff(user);
  const org = primaryOrganisation(user);
  const items = navFor(user, org?.id);

  return (
    <div className="min-h-dvh bg-surface">
      <a href="#main" className="sr-only z-[90] rounded-full bg-forest px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        {t("nav.skip")}
      </a>
      {staff && <Sidebar me={user} items={items} pathname={pathname} />}
      <div className={cn(staff && "lg:pl-72")}>
        <TopBar me={user} staff={staff} onMenu={() => setMenuOpen(true)} />
        <main id="main" className="mx-auto w-full max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:pb-12">
          {children}
        </main>
      </div>
      <BottomNav items={items} pathname={pathname} onMore={() => setMenuOpen(true)} me={user} />
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={t("nav.menu")}>
        <div className="flex flex-col gap-5">
          <UserCard me={user} />
          <LanguageSelect block align="left" />
          <nav aria-label={t("nav.main")}>
            <NavList items={items} pathname={pathname} onNavigate={() => setMenuOpen(false)} />
          </nav>
          <div className="flex flex-col gap-1 border-t border-line pt-4">
            <a href={LANDING_URL} className="flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-sm font-semibold text-ink hover:bg-surface">
              <ExternalLink className="size-4 text-muted" aria-hidden /> {t("nav.landing")}
            </a>
            <button
              type="button"
              onClick={() => signOut(() => qc.clear())}
              className="flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-sm font-semibold text-danger-900 hover:bg-danger-50"
            >
              <LogOut className="size-4" aria-hidden /> {t("nav.signOut")}
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
