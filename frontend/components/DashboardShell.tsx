"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  Bell,
  ChevronDown,
  Search,
  Gem,
  LogOut,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import UserMenu from "@/components/admin/UserMenu";
import UtilityBar from "@/components/UtilityBar";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
  badge?: number;
  /**
   * The permission this entry needs, if any.
   *
   * Omitted for links every signed-in user may follow — the public job feed,
   * for instance. When set, the entry appears only for an account that holds
   * it, so the menu never offers a screen the API would refuse.
   */
  permission?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

/*
 * Topbar height. The sidebar's sticky offset (lg:top-16) and column height
 * both derive from it, so the three stay in step.
 */
const TOPBAR = "h-16";

export default function DashboardShell({
  sections,
  searchPlaceholder,
  searchTypeLabel,
  notifCount,
  planTitle,
  planBody,
  children,
}: {
  sections: NavSection[];
  searchPlaceholder: string;
  searchTypeLabel: string;
  notifCount: number;
  planTitle: string;
  planBody: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, can } = useAuth();

  /*
   * Built from what this account can actually do. An entry with no permission
   * is open to any signed-in user; a section left empty is dropped entirely,
   * since a heading over nothing reads as a failure to load.
   */
  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || can(item.permission),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/*
        The same contact strip the public header carries. Without it the bar
        vanished the moment a user signed in, which read as the site changing
        identity between logged-out and logged-in.
      */}
      <UtilityBar />

      {/*
        sticky rather than fixed, so the browser derives the offset from the
        utility bar's real height. A hardcoded pixel value would have to be
        re-guessed whenever that bar's font or padding changed.
      */}
      {/* Owns the only logo in the shell — the sidebar used to repeat it. */}
      <header
        className={`sticky top-0 z-40 flex ${TOPBAR} items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6`}
      >
        <button
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label="Toggle sidebar"
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href="/" className="flex shrink-0 items-center">
          <img
            src="/logo-trimmed.png"
            alt="Energy Tail"
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/*
          A real form, not a decorative input: it submits to the job search
          the rest of the site already answers, so pressing Enter does what
          the placeholder promises.
        */}
        <form
          action="/jobs"
          method="GET"
          className="ml-2 hidden max-w-xl flex-1 items-center overflow-hidden rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 md:flex"
        >
          <div className="flex flex-1 items-center gap-2 px-3">
            <Search size={16} className="shrink-0 text-slate-400" />
            <label htmlFor="shell-search" className="sr-only">
              {searchPlaceholder}
            </label>
            <input
              id="shell-search"
              name="search"
              placeholder={searchPlaceholder}
              className="w-full py-2 text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <span className="flex items-center gap-1 border-l border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            {searchTypeLabel} <ChevronDown size={14} />
          </span>
          <button
            type="submit"
            className="bg-blue-600 px-3.5 py-2.5 text-white hover:bg-blue-700"
          >
            <Search size={15} />
          </button>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <button
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-blue-600"
            aria-label={
              notifCount > 0
                ? `Notifications, ${notifCount} unread`
                : "Notifications"
            }
          >
            <Bell size={20} />
            {notifCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                {notifCount}
              </span>
            )}
          </button>

          <div className="border-l border-slate-200 pl-3">
            <UserMenu align="right" />
          </div>
        </div>
      </header>

      <div className="flex">
        {/*
          Sticky at the topbar's height, so it pins under the bar once the
          utility strip has scrolled away and stays a full column short of
          the viewport — which is what stopped the second scrollbar.

          Fixed while the mobile drawer is open, because a sticky element
          cannot escape a scrolled parent.
        */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform lg:sticky lg:inset-y-auto lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/*
            Only the nav scrolls. Previously the whole sidebar was a viewport
            tall while starting below the topbar, so it overflowed by exactly
            the topbar's height and showed a second scrollbar inside the page.
          */}
          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
            {visibleSections.map((section) => (
              <div key={section.title}>
                <p className="mb-2 px-3 text-[11px] font-bold tracking-wider text-slate-400">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      // Marks the current page for assistive tech, not just colour.
                      aria-current={item.active ? "page" : undefined}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        item.active
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <item.icon size={17} className="shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Pinned below the scrolling nav, so it is always reachable. */}
          <div className="shrink-0 border-t border-slate-100 p-3">
            <Link
              href="/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              <Settings size={17} /> Settings
            </Link>
            {/*
              A link to /login only navigates — it leaves the session alive,
              so the login page bounces straight back to the dashboard. Signing
              out has to go through the API.
            */}
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              <LogOut size={17} /> Logout
            </button>

            <div className="mt-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white">
              <div className="mb-2 flex items-center gap-2">
                <Gem size={16} className="shrink-0" />
                <p className="text-sm font-bold">{planTitle}</p>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-blue-100">
                {planBody}
              </p>
              <Link
                href="/employer/billing"
                className="block w-full rounded-lg bg-white py-2 text-center text-xs font-bold text-blue-600 hover:bg-blue-50"
              >
                Upgrade Now →
              </Link>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        {/* lg:pl-64 clears the fixed sidebar without a spacer element. */}
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
