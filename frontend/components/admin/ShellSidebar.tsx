"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Link2, Trash2, Activity, ChevronDown, X } from "lucide-react";
import { navSections } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function ShellSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 transform flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-5">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <img src="/logo.png" alt="Energy Tail" className="h-9 w-auto object-contain" />
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-gray-400">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${
                          active
                            ? "bg-brand-50 text-brand-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <Icon
                          size={17}
                          strokeWidth={2}
                          className={active ? "text-brand-600" : "text-gray-400"}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Profile + quick links */}
        <div className="border-t border-gray-100 px-3 py-3">
          <button className="mb-3 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
              <span className="text-xs font-semibold text-gray-600">SA</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-gray-900">
                Super Admin
              </span>
              <span className="block truncate text-[12px] text-gray-500">
                admin@energytail.com
              </span>
            </span>
            <ChevronDown size={15} className="shrink-0 text-gray-400" />
          </button>

          <p className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-gray-400">
            Quick Links
          </p>
          <ul className="space-y-0.5">
            <li>
              <a
                href="/"
                className="flex items-center justify-between rounded-lg px-2 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
              >
                <span className="flex items-center gap-2.5">
                  <Link2 size={16} className="text-gray-400" />
                  View Site
                </span>
              </a>
            </li>
            <li>
              <a
                href="/admin/audit-logs"
                className="flex items-center justify-between rounded-lg px-2 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
              >
                <span className="flex items-center gap-2.5">
                  <Trash2 size={16} className="text-gray-400" />
                  Clear Cache
                </span>
              </a>
            </li>
            <li>
              <a
                href="/admin/audit-logs"
                className="flex items-center justify-between rounded-lg px-2 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
              >
                <span className="flex items-center gap-2.5">
                  <Activity size={16} className="text-gray-400" />
                  System Status
                </span>
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
