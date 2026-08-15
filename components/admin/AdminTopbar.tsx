"use client";

import { Search, Menu, Bell, MessageSquare, ChevronDown, ShieldCheck, Moon } from "lucide-react";
import { setOpen } from "./drawer-store";

export default function AdminTopbar({
  variant = "light",
  showThemeToggle = false,
  sticky = true,
  onMenuClick,
}: {
  variant?: "light" | "dark";
  showThemeToggle?: boolean;
  sticky?: boolean;
  onMenuClick?: () => void;
}) {
  const dark = variant === "dark";

  return (
    <header
      className={`h-[65px] flex items-center gap-4 px-5 border-b ${
        sticky ? "sticky top-0 z-20" : ""
      } ${dark ? "bg-[#0B2B26] border-[#0B2B26]" : "bg-white border-slate-100"}`}
    >
      <button
        onClick={onMenuClick ?? (() => setOpen(true))}
        className={`lg:hidden p-1.5 rounded-md ${dark ? "text-white hover:bg-white/10" : "text-slate-500 hover:bg-slate-50"}`}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden sm:block flex-1 max-w-xl">
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${dark ? "text-slate-300" : "text-slate-400"}`} />
          <input
            placeholder="Search users, companies, jobs, articles..."
            className={`w-full pl-9 pr-16 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 ${
              dark
                ? "bg-white/10 border-white/10 text-white placeholder:text-slate-300 focus:ring-white/20"
                : "bg-slate-50 border-slate-100 text-slate-700 placeholder:text-slate-400 focus:ring-blue-500/20"
            }`}
          />
          <span
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium px-1.5 py-0.5 rounded border hidden md:inline ${
              dark ? "text-slate-300 border-white/20" : "text-slate-400 border-slate-200"
            }`}
          >
            {dark ? "⌘ K" : "Ctrl + K"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-auto pr-1">
        {showThemeToggle && (
          <button className={`p-2 rounded-lg ${dark ? "text-white hover:bg-white/10" : "text-slate-500 hover:bg-slate-50"}`}>
            <Moon className="w-[18px] h-[18px]" />
          </button>
        )}

        <button className={`relative p-2 rounded-lg ${dark ? "text-white hover:bg-white/10" : "text-slate-500 hover:bg-slate-50"}`}>
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
            12
          </span>
        </button>

        {!dark && (
          <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-50">
            <MessageSquare className="w-[18px] h-[18px]" />
          </button>
        )}

        <div className={`h-8 w-px ${dark ? "bg-white/10" : "bg-slate-100"}`} />

        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${
              dark ? "bg-white/10 text-white" : "bg-slate-200 text-slate-500"
            }`}
          >
            {dark ? <ShieldCheck className="w-4 h-4" /> : <span className="text-xs font-semibold">SA</span>}
          </div>
          <div className="leading-tight hidden sm:block">
            <div className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>Super Admin</div>
            <div className={`text-xs ${dark ? "text-slate-300" : "text-slate-400"}`}>Administrator</div>
          </div>
          <ChevronDown className={`w-4 h-4 ${dark ? "text-slate-300" : "text-slate-400"}`} />
        </div>
      </div>
    </header>
  );
}
