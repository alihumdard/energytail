"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import {
  Plus,
  Download,
  Search,
  Eye,
  Pencil,
  Ban,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  UserRound,
  Building2,
  FileText,
  ShieldCheck,
  AlertTriangle,
  X,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { adminUsers } from "@/lib/api/endpoints";
import { useApiResource, useDebounced } from "@/lib/hooks/useApiResource";
import { ApiError, API_URL } from "@/lib/api/client";
import UserDetailModal from "@/components/admin/UserDetailModal";
import UserFormModal from "@/components/admin/UserFormModal";
import type { User } from "@/lib/api/types";

const ROLE_STYLE: Record<string, string> = {
  job_seeker: "bg-emerald-50 text-emerald-600",
  employer: "bg-blue-50 text-blue-600",
  author: "bg-orange-50 text-orange-600",
  administrator: "bg-red-50 text-red-600",
  guest: "bg-slate-100 text-slate-500",
};

const ROLE_LABEL: Record<string, string> = {
  job_seeker: "Job Seeker",
  employer: "Employer",
  author: "Article Author",
  administrator: "Administrator",
  guest: "Guest",
};

/** Tabs map to the role filter the API already supports. */
const TABS: { label: string; role?: string }[] = [
  { label: "All Users" },
  { label: "Job Seekers", role: "job_seeker" },
  { label: "Employers", role: "employer" },
  { label: "Article Authors", role: "author" },
  { label: "Administrators", role: "administrator" },
];

const CARD_META: Record<
  string,
  { icon: typeof Users; color: string; bg: string }
> = {
  job_seeker: {
    icon: UserRound,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  employer: { icon: Building2, color: "text-purple-600", bg: "bg-purple-50" },
  author: { icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
  administrator: { icon: ShieldCheck, color: "text-red-500", bg: "bg-red-50" },
};

const PIE_COLORS: Record<string, string> = {
  job_seeker: "#10b981",
  employer: "#2563eb",
  author: "#f59e0b",
  administrator: "#ef4444",
  guest: "#94a3b8",
};

interface RoleCount {
  role: string;
  label: string;
  total: number | string;
}

interface UserStats {
  total: number;
  active: number;
  suspended: number;
  unverified: number;
  by_role: RoleCount[];
  recent_signups: number;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "2 hours ago" style label for the Last Active column. */
function relativeTime(iso: string | null): string {
  if (!iso) return "Never";

  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return "Just now";

  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "minute"],
    [3600, "hour"],
    [86400, "day"],
    [604800, "week"],
    [2592000, "month"],
  ];

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  for (let i = units.length - 1; i >= 0; i--) {
    const [divisor, unit] = units[i];
    if (seconds >= divisor) {
      return formatter.format(-Math.floor(seconds / divisor), unit);
    }
  }

  return formatter.format(-Math.floor(seconds / 60), "minute");
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function UsersManagementPage() {
  const [activeTab, setActiveTab] = useState("All Users");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [verified, setVerified] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [busyId, setBusyId] = useState<number | null>(null);

  /*
   * Which dialog is open, if any. "create" carries no user; the other two
   * carry the row they were opened from, so the modal has its data without a
   * second request.
   */
  const [dialog, setDialog] = useState<
    | { mode: "create" }
    | { mode: "edit" | "view" | "delete"; user: User }
    | null
  >(null);

  /**
   * Why the last row action failed, shown in the page rather than a browser
   * alert. The API's refusals explain themselves — "this is the last active
   * administrator" — and belong next to the table, not in a box that has to
   * be dismissed before the row is visible again.
   */
  const [actionError, setActionError] = useState<string | null>(null);

  const debouncedSearch = useDebounced(search);
  const tabRole = TABS.find((t) => t.label === activeTab)?.role;

  const {
    data: list,
    loading,
    error,
    refetch,
  } = useApiResource(
    () =>
      adminUsers.list({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        role: tabRole,
        status: status || undefined,
        verified: verified || undefined,
      }),
    [page, perPage, debouncedSearch, tabRole, status, verified],
  );

  const { data: statsResponse, refetch: refetchStats } = useApiResource(
    () => adminUsers.stats(),
    [],
  );

  const stats = statsResponse?.data as unknown as UserStats | undefined;

  const summaryCards = useMemo(() => {
    const cards = [
      {
        label: "Total Users",
        value: stats?.total ?? 0,
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
    ];

    for (const row of stats?.by_role ?? []) {
      const meta = CARD_META[row.role];
      if (!meta) continue;

      cards.push({
        label: ROLE_LABEL[row.role] ?? row.label,
        value: Number(row.total),
        icon: meta.icon,
        color: meta.color,
        bg: meta.bg,
      });
    }

    return cards;
  }, [stats]);

  const pieData = useMemo(
    () =>
      (stats?.by_role ?? []).map((row) => ({
        name: ROLE_LABEL[row.role] ?? row.label,
        value: Number(row.total),
        color: PIE_COLORS[row.role] ?? "#94a3b8",
      })),
    [stats],
  );

  const totalUsers = stats?.total ?? 0;

  async function toggleStatus(user: User) {
    const next = user.status === "active" ? "suspended" : "active";

    const reason =
      next === "suspended"
        ? (window.prompt(`Why is ${user.full_name} being suspended?`) ??
          undefined)
        : undefined;

    // A null return from prompt means the admin cancelled.
    if (next === "suspended" && reason === undefined) return;

    setBusyId(user.id);
    setActionError(null);

    try {
      await adminUsers.setStatus(user.id, next, reason);
      refetch();
      refetchStats();
    } catch (err) {
      /*
       * ApiError.detail rather than .message: a 422's top-level text is
       * always "The given data was invalid.", while the reason worth reading
       * — "this is the last active administrator" — sits in the field errors.
       */
      setActionError(
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Could not update the user.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(user: User) {
    setBusyId(user.id);
    setActionError(null);

    try {
      await adminUsers.remove(user.id);
      setDialog(null);
      refetch();
      refetchStats();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Could not delete the user.",
      );
    } finally {
      setBusyId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setVerified("");
    setActiveTab("All Users");
    setPage(1);
  }

  const users = list?.data ?? [];
  const meta = list?.meta;
  const lastPage = meta?.last_page ?? 1;

  // A short window around the current page, so pagination stays usable at
  // any size without rendering hundreds of buttons.
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const from = Math.max(1, page - 1);
    const to = Math.min(lastPage, from + 2);

    for (let p = from; p <= to; p++) pages.push(p);

    return pages;
  }, [page, lastPage]);

  return (
    <AdminShell active="users">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Users Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            <span className="text-slate-400">Dashboard</span> &gt; Users
          </p>
        </div>
        <button
          onClick={() => setDialog({ mode: "create" })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2.5 text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="flex-1 text-sm text-amber-900">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            aria-label="Dismiss"
            className="rounded p-1 text-amber-600 hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-100 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => {
              setActiveTab(t.label);
              setPage(1);
            }}
            className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === t.label
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-slate-100 p-5"
          >
            <div
              className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}
            >
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="mt-3 text-sm text-slate-500">{s.label}</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {s.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Table + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="min-w-0 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
            <div className="text-sm text-slate-500">
              {meta
                ? `${meta.total.toLocaleString()} user${meta.total === 1 ? "" : "s"}`
                : "Loading…"}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`${API_URL}/api/v1/admin/users/export`}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg px-3.5 py-2 hover:bg-slate-50"
              >
                <Download className="w-4 h-4" />
                Export
              </a>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search users..."
                  className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-2 py-3 font-medium">Role</th>
                  <th className="px-2 py-3 font-medium">Status</th>
                  <th className="px-2 py-3 font-medium">Email Verified</th>
                  <th className="px-2 py-3 font-medium">Joined Date</th>
                  <th className="px-2 py-3 font-medium">Last Active</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      Loading users…
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

                {!loading && !error && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      No users match these filters.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  users.map((u) => {
                    const role = u.roles[0] ?? "guest";
                    const isActive = u.status === "active";

                    return (
                      <tr
                        key={u.id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0 flex items-center justify-center text-[11px] font-semibold text-slate-500">
                              {initials(u.full_name)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-slate-800 truncate">
                                {u.full_name}
                              </div>
                              <div className="text-xs text-slate-400 truncate">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3.5">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${ROLE_STYLE[role] ?? ROLE_STYLE.guest}`}
                          >
                            {ROLE_LABEL[role] ?? role}
                          </span>
                        </td>
                        <td className="px-2 py-3.5">
                          <span
                            className={`flex items-center gap-1.5 text-xs font-medium ${isActive ? "text-emerald-600" : "text-red-500"}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`}
                            />
                            {isActive ? "Active" : "Suspended"}
                          </span>
                        </td>
                        <td className="px-2 py-3.5">
                          <span
                            className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-white text-[10px] ${u.email_verified ? "bg-emerald-500" : "bg-red-500"}`}
                            title={
                              u.email_verified ? "Verified" : "Not verified"
                            }
                          >
                            {u.email_verified ? "✓" : "✕"}
                          </span>
                        </td>
                        <td className="px-2 py-3.5 text-slate-500 whitespace-nowrap">
                          {formatDate(u.created_at)}
                        </td>
                        <td className="px-2 py-3.5 text-slate-500 whitespace-nowrap">
                          {relativeTime(u.last_login_at)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                setDialog({ mode: "view", user: u })
                              }
                              className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDialog({ mode: "edit", user: u })
                              }
                              className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleStatus(u)}
                              disabled={busyId === u.id}
                              title={isActive ? "Suspend" : "Reactivate"}
                              className={`p-1.5 rounded-md disabled:opacity-40 ${
                                isActive
                                  ? "text-slate-400 hover:bg-red-50 hover:text-red-600"
                                  : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                              }`}
                            >
                              {isActive ? (
                                <Ban className="w-4 h-4" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                setDialog({ mode: "delete", user: u })
                              }
                              disabled={busyId === u.id}
                              title="Delete"
                              className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {meta && meta.total > 0
                ? `Showing ${(meta.current_page - 1) * meta.per_page + 1} to ${Math.min(
                    meta.current_page * meta.per_page,
                    meta.total,
                  )} of ${meta.total.toLocaleString()} users`
                : "No results"}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
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

              {lastPage > 3 && page < lastPage - 1 && (
                <>
                  <span className="text-slate-400 text-xs px-1">…</span>
                  <button
                    onClick={() => setPage(lastPage)}
                    className="w-8 h-8 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    {lastPage}
                  </button>
                </>
              )}

              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
                className="p-1.5 rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="ml-1 text-xs border border-slate-200 rounded-md px-2 py-1.5 text-slate-600"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">User Summary</h2>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 shrink-0 relative">
                {pieData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        innerRadius={34}
                        outerRadius={54}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {pieData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-bold text-slate-900">
                    {totalUsers.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-400">Total Users</span>
                </div>
              </div>
              <div className="flex-1 space-y-2 text-xs">
                {pieData.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: r.color }}
                      />
                      {r.name}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {r.value.toLocaleString()} (
                      {totalUsers > 0
                        ? ((r.value / totalUsers) * 100).toFixed(1)
                        : "0.0"}
                      %)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1.5 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Email Verified
                </label>
                <select
                  value={verified}
                  onChange={(e) => {
                    setVerified(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1.5 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600"
                >
                  <option value="">All</option>
                  <option value="1">Verified</option>
                  <option value="0">Unverified</option>
                </select>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Filters apply as you change them.
              </div>
            </div>
          </div>
        </div>
      </div>

      {(dialog?.mode === "create" || dialog?.mode === "edit") && (
        <UserFormModal
          user={dialog.mode === "edit" ? dialog.user : null}
          onClose={() => setDialog(null)}
          onSaved={() => {
            refetch();
            refetchStats();
          }}
        />
      )}

      {dialog?.mode === "view" && (
        <UserDetailModal
          user={dialog.user}
          onClose={() => setDialog(null)}
          // Swaps one dialog for the other rather than stacking them.
          onEdit={() => setDialog({ mode: "edit", user: dialog.user })}
          onChanged={() => {
            refetch();
            refetchStats();
          }}
        />
      )}

      {dialog?.mode === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Delete {dialog.user.full_name}?
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  This removes them from the active user list. Their existing
                  jobs, articles and audit history are kept.
                </p>
                {actionError && (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {actionError}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDialog(null)}
                disabled={busyId === dialog.user.id}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(dialog.user)}
                disabled={busyId === dialog.user.id}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
              >
                {busyId === dialog.user.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
