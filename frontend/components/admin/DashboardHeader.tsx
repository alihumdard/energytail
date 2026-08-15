"use client";

import { Menu, Search, Bell, MessageSquare, ChevronDown } from "lucide-react";

export default function DashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 shrink-0"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-xl hidden sm:block">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search users, companies, jobs, articles..."
            className="w-full bg-gray-100 rounded-lg pl-9 pr-14 py-2 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5">
            Ctrl + K
          </span>
        </div>
      </div>

      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-2 lg:gap-4 shrink-0">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <Bell size={20} />
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
            12
          </span>
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hidden sm:inline-flex">
          <MessageSquare size={20} />
        </button>
        <div className="flex items-center gap-2 pl-2 lg:border-l lg:border-gray-200 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
            SA
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-semibold text-gray-900">Super Admin</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
          <ChevronDown size={16} className="text-gray-400 hidden md:block" />
        </div>
      </div>
    </header>
  );
}
