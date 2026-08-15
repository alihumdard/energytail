"use client";

import { useState } from "react";
import Shell from "@/components/admin/Shell";
import { Badge, PageHeader } from "@/components/admin/ShellUI";
import { auditLogs } from "@/data/adminMockData";
import {
  Download,
  ChevronDown,
  Search,
  Calendar,
  RefreshCw,
  Columns3,
  MoreVertical,
  X,
  PlusCircle,
  Pencil,
  Eye,
  UploadCloud,
  Trash2,
  Lock,
  User,
  MapPin,
  Monitor,
  ExternalLink,
} from "lucide-react";

const actionIcon: Record<string, { icon: typeof PlusCircle; color: string }> = {
  Created: { icon: PlusCircle, color: "text-green-600" },
  Updated: { icon: Pencil, color: "text-blue-600" },
  Viewed: { icon: Eye, color: "text-purple-600" },
  Submitted: { icon: UploadCloud, color: "text-amber-600" },
  Deleted: { icon: Trash2, color: "text-red-600" },
  Login: { icon: Lock, color: "text-gray-500" },
};

const statusColor: Record<string, "green" | "amber" | "red"> = {
  Success: "green",
  Pending: "amber",
  Failed: "red",
};

export default function AuditLogsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [panelOpen, setPanelOpen] = useState(true);
  const selected = auditLogs.find((l) => l.id === selectedId) ?? null;

  return (
    <Shell>
      <PageHeader
        title="Audit / Activity Logs"
        breadcrumb={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Audit Logs" }]}
        description="Track and review all important actions performed across the platform."
        actions={
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50">
            <Download size={15} />
            Export Logs
            <ChevronDown size={14} className="text-gray-400" />
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-card sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Search Logs">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                placeholder="Search by user, action, module..."
                className="input pl-9"
              />
            </div>
          </Field>
          <Field label="User">
            <Select options={["All Users", "Super Admin", "Sarah Khan", "Ali Raza"]} />
          </Field>
          <Field label="Module">
            <Select
              options={["All Modules", "Jobs", "Companies", "Articles", "Users", "Settings"]}
            />
          </Field>
          <Field label="Action">
            <Select
              options={["All Actions", "Created", "Updated", "Viewed", "Deleted", "Login"]}
            />
          </Field>
          <Field label="Date Range">
            <div className="relative">
              <Calendar
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                readOnly
                value="May 14, 2025 - May 21, 2025"
                className="input cursor-pointer pl-9"
              />
            </div>
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Status">
            <Select options={["All Status", "Success", "Pending", "Failed"]} />
          </Field>
          <Field label="IP Address">
            <input placeholder="Search IP address" className="input" />
          </Field>
          <div className="flex items-end gap-2 lg:col-span-3 lg:justify-end">
            <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50">
              Reset
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700">
              <SlidersIcon />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-5 ${panelOpen ? "xl:grid-cols-[1fr_340px]" : ""}`}>
        {/* Table */}
        <div className="min-w-0 rounded-xl border border-gray-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
            <p className="text-[13px] text-gray-500">
              Showing 1 to 8 of 1,248 logs
            </p>
            <div className="flex items-center gap-2">
              <button className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">
                <RefreshCw size={14} />
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50">
                <Columns3 size={14} />
                Columns
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 text-[12px] uppercase tracking-wide text-gray-400">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th className="px-3 py-3 font-medium">Date &amp; Time</th>
                  <th className="px-3 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                  <th className="px-3 py-3 font-medium">Module</th>
                  <th className="px-3 py-3 font-medium">Record / Details</th>
                  <th className="px-3 py-3 font-medium">IP Address</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="w-10 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => {
                  const ActionIcon = actionIcon[log.action]?.icon ?? Lock;
                  const active = log.id === selectedId;
                  return (
                    <tr
                      key={log.id}
                      onClick={() => {
                        setSelectedId(log.id);
                        setPanelOpen(true);
                      }}
                      className={`cursor-pointer border-b border-gray-50 last:border-0 ${
                        active ? "bg-brand-50/60" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => {
                            setSelectedId(log.id);
                            setPanelOpen(true);
                          }}
                          className="rounded border-gray-300 text-brand-600"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <p className="font-medium text-gray-900">{log.date}</p>
                        <p className="text-gray-400">{log.time}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-[11px] font-semibold text-gray-600">
                            {log.user
                              .split(" ")
                              .map((w) => w[0])
                              .join("")}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{log.user}</p>
                            <p className="text-gray-400">{log.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${actionIcon[log.action]?.color}`}
                        >
                          <ActionIcon size={14} />
                          {log.action}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                        {log.module}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900">{log.record}</p>
                        {log.recordSub && (
                          <p className="text-gray-400">{log.recordSub}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                        {log.ip}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <Badge color={statusColor[log.status]}>{log.status}</Badge>
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <button className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100">
                          <MoreVertical size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:px-5">
            <div className="flex items-center gap-2 text-[13px] text-gray-500">
              Rows per page
              <Select options={["15", "25", "50"]} className="!w-20" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {["First", "Previous"].map((l) => (
                <button
                  key={l}
                  className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[13px] text-gray-500 hover:bg-gray-50"
                >
                  {l}
                </button>
              ))}
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  className={`h-8 w-8 rounded-md text-[13px] font-medium ${
                    n === 1
                      ? "bg-brand-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="px-1 text-gray-400">...</span>
              <button className="h-8 w-8 rounded-md border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50">
                84
              </button>
              {["Next", "Last"].map((l) => (
                <button
                  key={l}
                  className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[13px] text-gray-500 hover:bg-gray-50"
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Details panel */}
        {panelOpen && selected && (
          <div className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-gray-900">
                Log Details
              </h3>
              <button
                onClick={() => setPanelOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <PlusCircle size={20} />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">
                  {selected.action}
                </p>
                <p className="text-[13px] text-gray-500">
                  A new {selected.module.toLowerCase().slice(0, -1) || selected.module.toLowerCase()} has been {selected.action.toLowerCase()}.
                </p>
              </div>
            </div>

            <dl className="space-y-4 text-[13px]">
              <Detail label="Date & Time">
                <p className="text-gray-800">
                  {selected.date} {selected.time}
                </p>
              </Detail>
              <Detail label="User" icon={User}>
                <p className="font-medium text-gray-900">{selected.user}</p>
                <p className="text-gray-500">{selected.role}</p>
              </Detail>
              <Detail label="Module">
                <p className="text-gray-800">{selected.module}</p>
              </Detail>
              <Detail label="Record">
                <p className="font-medium text-gray-900">{selected.record}</p>
                {selected.recordSub && (
                  <p className="text-gray-500">{selected.recordSub}</p>
                )}
              </Detail>
              <Detail label="IP Address">
                <p className="text-gray-800">{selected.ip}</p>
              </Detail>
              <Detail label="User Agent" icon={Monitor}>
                <p className="text-gray-500">
                  Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
                  (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36
                </p>
              </Detail>
              <Detail label="Location" icon={MapPin}>
                <p className="text-gray-800">Lahore, Punjab, Pakistan</p>
              </Detail>
              <Detail label="Status">
                <Badge color={statusColor[selected.status]}>
                  {selected.status}
                </Badge>
              </Detail>
            </dl>

            <button className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">
              View Associated Record
              <ExternalLink size={14} />
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-gray-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  options,
  className = "",
}: {
  options: string[];
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select className="input appearance-none pr-8">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  );
}

function Detail({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-gray-400">
        {Icon && <Icon size={12} />}
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function SlidersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3M1 14H7M9 8H15M17 16H23"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
