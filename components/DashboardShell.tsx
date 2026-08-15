"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  MessageSquare,
  Bell,
  ChevronDown,
  Search,
  Gem,
  LogOut,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
  badge?: number;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export default function DashboardShell({
  sections,
  searchPlaceholder,
  searchTypeLabel,
  userName,
  userRole,
  userAvatarInitials,
  notifCount,
  msgCount,
  planTitle,
  planBody,
  children,
}: {
  sections: NavSection[];
  searchPlaceholder: string;
  searchTypeLabel: string;
  userName: string;
  userRole: string;
  userAvatarInitials?: string;
  notifCount: number;
  msgCount: number;
  planTitle: string;
  planBody: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4 px-4 md:px-6 py-3">
          <button
            className="lg:hidden text-slate-500"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu size={22} />
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Energy Tail" className="h-9 w-auto object-contain" />
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl items-center border border-slate-200 rounded-lg overflow-hidden ml-4">
            <div className="flex items-center gap-2 px-3 py-2 flex-1">
              <Search size={16} className="text-slate-400" />
              <input
                placeholder={searchPlaceholder}
                className="w-full text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-1 px-3 py-2 border-l border-slate-200 text-sm text-slate-500 bg-slate-50">
              {searchTypeLabel} <ChevronDown size={14} />
            </div>
            <button className="px-3.5 py-2.5 bg-blue-600 text-white">
              <Search size={15} />
            </button>
          </div>

          <div className="flex items-center gap-3 md:gap-4 ml-auto shrink-0">
            <button className="text-slate-500 hover:text-blue-600">
              <MessageSquare size={20} />
            </button>
            <button className="relative text-slate-500 hover:text-blue-600">
              <Bell size={20} />
              {notifCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 grid place-items-center text-[9px] font-bold text-white bg-blue-600 rounded-full">
                  {notifCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              {userAvatarInitials ? (
                <span className="w-8 h-8 rounded-lg bg-blue-600 text-white grid place-items-center text-xs font-bold">
                  {userAvatarInitials}
                </span>
              ) : (
                <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 grid place-items-center text-xs font-bold overflow-hidden">
                  🧑
                </span>
              )}
              <span className="hidden sm:block leading-tight">
                <span className="block text-sm font-semibold text-slate-800">{userName}</span>
                <span className="block text-[11px] text-slate-400">{userRole}</span>
              </span>
              <ChevronDown size={14} className="hidden sm:block text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-[57px] lg:top-0 left-0 z-30 h-[calc(100vh-57px)] lg:h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="hidden lg:flex items-center gap-2 px-6 py-5 border-b border-slate-100">
            <img src="/logo.png" alt="Energy Tail" className="h-8 w-auto object-contain" />
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {sections.map((sec) => (
              <div key={sec.title}>
                <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 mb-2">
                  {sec.title}
                </p>
                <div className="space-y-1">
                  {sec.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        item.active
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <item.icon size={17} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="text-[10px] font-bold text-white bg-blue-600 rounded-full px-1.5 py-0.5">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-slate-100 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              <Settings size={17} /> Settings
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              <LogOut size={17} /> Logout
            </Link>
          </div>

          <div className="m-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Gem size={16} />
              <p className="text-sm font-bold">{planTitle}</p>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed mb-3">{planBody}</p>
            <button className="w-full bg-white text-blue-600 text-xs font-bold rounded-lg py-2">
              Upgrade Now →
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 md:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}