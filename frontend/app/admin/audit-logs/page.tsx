"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { adminAudit } from "@/lib/api/endpoints";
import { useApiResource, useDebounced } from "@/lib/hooks/useApiResource";
import { API_URL } from "@/lib/api/client";

/** Colour per action verb, so the log scans at a glance. */
const ACTION_STYLE: Record<string, string> = {
  created: "bg-emerald-50 text-emerald-600",
  register: "bg-emerald-50 text-emerald-600",
  updated: "bg-blue-50 text-blue-600",
  login: "bg-slate-100 text-slate-600",
  logout: "bg-slate-100 text-slate-600",
  deleted: "bg-red-50 text-red-600",
  login_failed: "bg-red-50 text-red-600",
  suspended: "bg-orange-50 text-orange-600",
  reactivated: "bg-emerald-50 text-emerald-600",
  verify_email: "bg-purple-50 text-purple-600",
  password_reset: "bg-amber-50 text-amber-700",
};

const STATUS_STYLE: Record<string, string> = {
  success: "text-emerald-600",
  pending: "text-amber-600",
  failed: "text-red-600",
};

function humanise(value: string | null): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounced(search);

  const {
    data: list,
    loading,
    error,
    refetch,
  } = useApiResource(
    () =>
      adminAudit.list({
        page,
        per_page: 20,
        search: debouncedSearch || undefined,
        module: module || undefined,
        action: action || undefined,
        role: role || undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    [page, debouncedSearch, module, action, role, status, from, to],
  );

  const { data: filtersResponse } = useApiResource(
    () => adminAudit.filters(),
    [],
  );
  const { data: statsResponse } = useApiResource(() => adminAudit.stats(), []);

  const filters = filtersResponse?.data;
  const stats = statsResponse?.data as
    | {
        total: number;
        today: number;
        failed: number;
        failed_logins_week: number;
      }
    | undefined;

  const entries = list?.data ?? [];
  const meta = list?.meta;
  const lastPage = meta?.last_page ?? 1;

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(lastPage, start + 2);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  }, [page, lastPage]);

  function clearFilters() {
    setSearch("");
    setModule("");
    setAction("");
    setRole("");
    setStatus("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  return (
    <AdminShell active="audit-logs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            <span className="text-slate-400">Dashboard</span> &gt; Audit Logs
          </p>
        </div>
        <a
          href={`${API_URL}/api/v1/admin/audit-logs/export`}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 border border-slate-200 bg-white rounded-lg px-3.5 py-2.5 hover:bg-slate-50 shrink-0"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </a>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Events",
              value: stats.total,
              tone: "text-slate-900",
            },
            { label: "Today", value: stats.today, tone: "text-slate-900" },
            {
              label: "Failed Events",
              value: stats.failed,
              tone: "text-red-600",
            },
            {
              label: "Failed Logins (7d)",
              value: stats.failed_logins_week,
              // The number worth watching for a brute-force attempt.
              tone:
                stats.failed_logins_week > 0
                  ? "text-orange-600"
                  : "text-slate-900",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-slate-100 p-5"
            >
              <div className="text-sm text-slate-500">{card.label}</div>
              <div className={`text-2xl font-bold mt-1 ${card.tone}`}>
                {Number(card.value ?? 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search description or user..."
              className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {[
            {
              value: module,
              set: setModule,
              options: filters?.modules,
              label: "All Modules",
            },
            {
              value: action,
              set: setAction,
              options: filters?.actions,
              label: "All Actions",
            },
            {
              value: role,
              set: setRole,
              options: filters?.roles,
              label: "All Roles",
            },
            {
              value: status,
              set: setStatus,
              options: filters?.statuses,
              label: "All Statuses",
            },
          ].map((f) => (
            <select
              key={f.label}
              value={f.value}
              onChange={(e) => {
                f.set(e.target.value);
                setPage(1);
              }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600"
            >
              <option value="">{f.label}</option>
              {(f.options ?? []).map((o) => (
                <option key={o} value={o}>
                  {humanise(o)}
                </option>
              ))}
            </select>
          ))}

          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600"
          />

          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 font-medium hover:underline ml-auto"
          >
            Clear All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Date &amp; Time</th>
                <th className="px-2 py-3 font-medium">User</th>
                <th className="px-2 py-3 font-medium">Action</th>
                <th className="px-2 py-3 font-medium">Module</th>
                <th className="px-2 py-3 font-medium">Description</th>
                <th className="px-2 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Loading audit log…
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <p className="text-sm text-red-600">{error.message}</p>
                    <button
                      onClick={() => refetch()}
                      className="mt-2 text-sm font-medium text-blue-600 hover:underline"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              )}

              {!loading && !error && entries.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    No events match these filters.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                entries.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-slate-700">{log.date}</div>
                      <div className="text-xs text-slate-400">{log.time}</div>
                    </td>
                    <td className="px-2 py-3.5">
                      <div className="text-slate-700">
                        {log.user ?? "System"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {humanise(log.role)}
                      </div>
                    </td>
                    <td className="px-2 py-3.5">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                          ACTION_STYLE[log.action ?? ""] ??
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {humanise(log.action)}
                      </span>
                    </td>
                    <td className="px-2 py-3.5 text-slate-500">
                      {humanise(log.module)}
                    </td>
                    <td
                      className="px-2 py-3.5 text-slate-600 max-w-xs truncate"
                      title={log.description}
                    >
                      {log.description}
                    </td>
                    <td className="px-2 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {log.ip ?? "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-medium ${STATUS_STYLE[log.status] ?? "text-slate-500"}`}
                      >
                        {humanise(log.status)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {meta && meta.total > 0
              ? `Showing ${(meta.current_page - 1) * meta.per_page + 1} to ${Math.min(
                  meta.current_page * meta.per_page,
                  meta.total,
                )} of ${meta.total.toLocaleString()} events`
              : "No results"}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-md text-xs font-medium ${
                  p === page
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="p-1.5 rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
