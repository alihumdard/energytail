"use client";

import { Menu, Search, Bell, MessageSquare, ChevronDown } from "lucide-react";

export default function ShellTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      <div className="relative hidden flex-1 max-w-xl sm:block">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search users, companies, jobs, articles..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-16 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-gray-400">
          Ctrl + K
        </span>
      </div>

      <button
        className="ml-auto rounded-md p-1.5 text-gray-500 hover:bg-gray-100 sm:ml-0"
        aria-label="Search"
      >
        <Search size={19} className="sm:hidden" />
      </button>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            12
          </span>
        </button>
        <button
          className="hidden rounded-md p-2 text-gray-500 hover:bg-gray-100 sm:inline-flex"
          aria-label="Messages"
        >
          <MessageSquare size={19} />
        </button>

        <button className="ml-1 flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50 sm:pl-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[12px] font-semibold text-brand-700">
            SA
          </span>
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-[13px] font-semibold text-gray-900">
              Super Admin
            </span>
            <span className="block text-[11px] text-gray-500">Administrator</span>
          </span>
          <ChevronDown size={15} className="hidden text-gray-400 md:block" />
        </button>
      </div>
    </header>
  );
}
