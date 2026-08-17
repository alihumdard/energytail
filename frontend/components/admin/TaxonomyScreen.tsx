"use client";

import { useMemo, useState } from "react";
import AdminSidebar, { type AdminNavKey } from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import {
  Plus,
  Download,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useApiResource, useDebounced } from "@/lib/hooks/useApiResource";
import type { TaxonomyItem, TaxonomyStats, Paginated, ApiEnvelope } from "@/lib/api/types";

interface TaxonomyApi {
  list: (params?: Record<string, string | number | undefined>) => Promise<Paginated<TaxonomyItem>>;
  toggleActive: (id: number) => Promise<ApiEnvelope<TaxonomyItem>>;
  remove: (id: number) => Promise<{ message: string }>;
  stats: () => Promise<ApiEnvelope<TaxonomyStats>>;
  exportUrl: () => string;
}

interface Props {
  /** Sidebar highlight key, typed so a typo cannot silently unhighlight it. */
  navKey: AdminNavKey;
  title: string;
  /** Lowercase plural used in sentences: "12 industries". */
  noun: string;
  api: TaxonomyApi;
  /** Extra columns beyond name and status. */
  columns?: {
    header: string;
    render: (item: TaxonomyItem) => React.ReactNode;
  }[];
  /** Labels for the stats strip, keyed by the API's stat keys. */
  statLabels?: Record<string, string>;
  tips?: string[];
}

const DEFAULT_STAT_LABELS: Record<string, string> = {
  total: "Total",
  active: "Active",
  inactive: "Inactive",
  jobs: "Jobs",
  articles: "Articles",
  in_demand: "In Demand",
  in_use: "In Use",
  assignments: "Assignments",
  featured: "Featured",
};

/**
 * Shared screen for the admin taxonomy managers.
 *
 * All six resources expose the same endpoints and render the same layout, so
 * the behaviour lives here once and each page supplies only its columns and
 * labels — mirroring the base controller these talk to.
 */
export default function TaxonomyScreen({
  navKey,
  title,
  noun,
  api,
  columns = [],
  statLabels = {},
  tips = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: list, loading, error, refetch } = useApiResource(
    () =>
      api.list({
        page,
        per_page: 15,
        search: debouncedSearch || undefined,
        is_active: activeFilter || undefined,
      }),
    [page, debouncedSearch, activeFilter],
  );

  const { data: statsResponse, refetch: refetchStats } = useApiResource(
    () => api.stats(),
    [],
  );

  const stats = statsResponse?.data;
  const items = list?.data ?? [];
  const meta = list?.meta;
  const lastPage = meta?.last_page ?? 1;

  const labels = useMemo(
    () => ({ ...DEFAULT_STAT_LABELS, ...statLabels }),
    [statLabels],
  );

  async function toggle(item: TaxonomyItem) {
    setBusyId(item.id);
    try {
      await api.toggleActive(item.id);
      await Promise.all([refetch(), refetchStats()]);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not update the record.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: TaxonomyItem) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

    setBusyId(item.id);
    try {
      await api.remove(item.id);
      await Promise.all([refetch(), refetchStats()]);
    } catch (err) {
      // The API refuses to delete records still in use and explains why —
      // surfacing its message is more useful than a generic failure.
      window.alert(err instanceof Error ? err.message : "Could not delete the record.");
    } finally {
      setBusyId(null);
    }
  }

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const from = Math.max(1, page - 1);
    const to = Math.min(lastPage, from + 2);
    for (let p = from; p <= to; p++) pages.push(p);
    return pages;
  }, [page, lastPage]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar active={navKey} />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar variant="dark" showThemeToggle />

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              <p className="text-sm text-slate-500 mt-1">
                <span className="text-slate-400">Dashboard</span> &gt; {title}
              </p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2.5 text-sm shrink-0">
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>

          {/* Stats strip */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(stats.stats).map(([key, value]) => (
                <div key={key} className="bg-white rounded-2xl border border-slate-100 p-5">
                  <div className="text-sm text-slate-500">{labels[key] ?? key}</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {Number(value).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
            {/* Table */}
            <div className="min-w-0 bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
                <div className="text-sm text-slate-500">
                  {meta ? `${meta.total.toLocaleString()} ${noun}` : "Loading…"}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={activeFilter}
                    onChange={(e) => {
                      setActiveFilter(e.target.value);
                      setPage(1);
                    }}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600"
                  >
                    <option value="">All</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                  <a
                    href={api.exportUrl()}
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
                      placeholder="Search..."
                      className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="px-4 py-3 font-medium">Name</th>
                      {columns.map((c) => (
                        <th key={c.header} className="px-2 py-3 font-medium">
                          {c.header}
                        </th>
                      ))}
                      <th className="px-2 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={columns.length + 3} className="px-4 py-10 text-center text-slate-400">
                          Loading…
                        </td>
                      </tr>
                    )}

                    {!loading && error && (
                      <tr>
                        <td colSpan={columns.length + 3} className="px-4 py-10 text-center">
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

                    {!loading && !error && items.length === 0 && (
                      <tr>
                        <td colSpan={columns.length + 3} className="px-4 py-10 text-center text-slate-400">
                          Nothing matches these filters.
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      !error &&
                      items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              {(item.emoji || item.icon || item.flag_emoji) && (
                                <span
                                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
                                  style={{ backgroundColor: `${item.color ?? "#64748b"}1a` }}
                                >
                                  {item.emoji ?? item.icon ?? item.flag_emoji}
                                </span>
                              )}
                              <div className="min-w-0">
                                <div className="font-medium text-slate-800 truncate">{item.name}</div>
                                <div className="text-xs text-slate-400 truncate">
                                  {item.description ?? item.slug}
                                </div>
                              </div>
                            </div>
                          </td>

                          {columns.map((c) => (
                            <td key={c.header} className="px-2 py-3.5 text-slate-500">
                              {c.render(item)}
                            </td>
                          ))}

                          <td className="px-2 py-3.5">
                            <button
                              onClick={() => toggle(item)}
                              disabled={busyId === item.id}
                              title={item.is_active ? "Deactivate" : "Activate"}
                              className={`flex items-center gap-1.5 text-xs font-medium disabled:opacity-40 ${
                                item.is_active ? "text-emerald-600" : "text-slate-400"
                              }`}
                            >
                              <span
                                className={`w-8 h-4 rounded-full relative transition-colors ${
                                  item.is_active ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                                    item.is_active ? "left-4" : "left-0.5"
                                  }`}
                                />
                              </span>
                              {item.is_active ? "Active" : "Inactive"}
                            </button>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => remove(item)}
                                disabled={busyId === item.id}
                                title="Delete"
                                className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                              >
                                {busyId === item.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
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
                      )} of ${meta.total.toLocaleString()} ${noun}`
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

            {/* Right column */}
            <div className="space-y-6">
              {stats && stats.donut.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                  <h2 className="font-semibold text-slate-900 mb-4">Breakdown</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-28 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.donut}
                            dataKey="value"
                            innerRadius={34}
                            outerRadius={54}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {stats.donut.map((d) => (
                              <Cell key={d.label} fill={d.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2 text-xs">
                      {stats.donut.map((d) => (
                        <div key={d.label} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-slate-600 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: d.color }}
                            />
                            <span className="truncate">{d.label}</span>
                          </span>
                          <span className="text-slate-500 font-medium shrink-0">
                            {d.value.toLocaleString()} ({d.pct}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {stats && stats.top.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                  <h2 className="font-semibold text-slate-900 mb-4">Top 5</h2>
                  <ol className="space-y-2.5">
                    {stats.top.map((t, i) => (
                      <li key={t.label} className="flex items-center gap-3 text-sm">
                        <span className="w-5 h-5 rounded bg-slate-100 text-slate-500 text-[11px] font-semibold flex items-center justify-center shrink-0">
                          {t.rank ?? i + 1}
                        </span>
                        <span className="text-slate-700 truncate flex-1">{t.label}</span>
                        <span className="text-slate-500 font-medium shrink-0">
                          {t.value.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {tips.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <h2 className="font-semibold text-slate-900 mb-2 text-sm">Tips</h2>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                    {tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
