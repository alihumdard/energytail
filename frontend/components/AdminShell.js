"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Shared";
import AdminTopbar from "./admin/AdminTopbar";
import {
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  Gauge,
  KeyRound,
  HelpCircle,
  ScrollText,
  Settings,
  Users,
  X,
  ShieldCheck,
} from "lucide-react";

const nav = [
  { label: "Dashboard", icon: Gauge, href: "/admin/dashboard" },
  { label: "Users", icon: Users, href: "/admin/users" },
  { label: "Companies", icon: Building2, href: "/admin/companies", caret: true },
  {
    label: "Jobs",
    icon: Briefcase,
    open: true,
    children: [
      { label: "All Jobs", href: "/admin/jobs" },
      { label: "Add New Job", href: "/admin/job-details" },
      { label: "Job Categories", href: "/admin/job-categories" },
    ],
  },
  { label: "Articles", icon: FileText, href: "/admin/articles" },
  { label: "Applications", icon: ClipboardList, href: "/admin/jobs" },
  { label: "Reports", icon: ScrollText, href: "/admin/audit-logs" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
  { label: "Roles & Permissions", icon: KeyRound, href: "/admin/roles-permissions" },
  { label: "System Settings", icon: ShieldCheck, href: "/admin/settings" },
  { label: "Audit Logs", icon: ScrollText, href: "/admin/audit-logs" },
];

function SidebarContent() {
  const [jobsOpen, setJobsOpen] = useState(true);
  return (
    <>
      <div className="flex h-[74px] items-center border-b border-[#eef2f7] px-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {nav.map((item) => {
          const Icon = item.icon;
          const isJobs = item.label === "Jobs";
          if (isJobs) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => setJobsOpen(!jobsOpen)}
                  className="nav-item w-full nav-item-active"
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {jobsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {jobsOpen && (
                  <div className="mb-1 mt-1 space-y-1 pl-11">
                    {item.children.map((c) => (
                      <Link
                        key={c.label}
                        href={c.href}
                        className="block py-1.5 text-[13px] font-semibold text-ink-700 hover:text-brand-500"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link key={item.label} href={item.href} className="nav-item w-full">
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.caret && <ChevronDown className="h-4 w-4 text-ink-500" />}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl bg-[#f4f7fd] p-4">
        <div className="mb-1.5 flex items-center gap-2 text-[13px] font-bold">
          <HelpCircle className="h-4 w-4 text-brand-500" /> Need Help?
        </div>
        <p className="mb-3.5 text-[12px] leading-relaxed text-ink-500">
          Check our docs or contact support.
        </p>
        <button className="h-9 w-full rounded-lg border border-[#dbe4f2] bg-white text-[12.5px] font-semibold text-ink-700 hover:bg-slate-50">
          Visit Help Center
        </button>
      </div>
    </>
  );
}

export default function AdminShell({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[262px] flex-col border-r border-[#e8edf5] bg-white lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-white">
            <button
              className="absolute right-4 top-6 text-ink-500"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="lg:pl-[262px]">
        <AdminTopbar variant="dark" onMenuClick={() => setOpen(true)} />
        <main className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
