"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { type AdminNavKey } from "@/components/admin/AdminSidebar";
import {
  Plus,
  Download,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ApiError } from "@/lib/api/client";
import { useApiResource, useDebounced } from "@/lib/hooks/useApiResource";
import TaxonomyFormModal, {
  type TaxonomyField,
} from "@/components/admin/TaxonomyFormModal";
import type {
  TaxonomyItem,
  TaxonomyStats,
  Paginated,
  ApiEnvelope,
} from "@/lib/api/types";

interface TaxonomyApi {
  list: (
    params?: Record<string, string | number | undefined>,
  ) => Promise<Paginated<TaxonomyItem>>;
  create: (
    payload: Record<string, unknown>,
  ) => Promise<ApiEnvelope<TaxonomyItem>>;
  update: (
    id: number,
    payload: Record<string, unknown>,
  ) => Promise<ApiEnvelope<TaxonomyItem>>;
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
  /**
   * Inputs on the add/edit form. Declared per screen because the six
   * resources share a layout but not their fields.
   */
  fields: TaxonomyField[];
  /** Singular noun for the dialog title: "Add Country". */
  singular: string;
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
  singular,
  api,
  fields,
  columns = [],
  statLabels = {},
  tips = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);

  /** Which form is open: adding a record, or editing the one it carries. */
  const [dialog, setDialog] = useState<
    { mode: "create" } | { mode: "edit"; item: TaxonomyItem } | null
  >(null);

  /** The record awaiting delete confirmation. */
  const [confirming, setConfirming] = useState<TaxonomyItem | null>(null);

  /**
   * Why the last action failed, shown in the page rather than a browser
   * alert. The API's refusals are explanatory — "used by 7 jobs, deactivate
   * it instead" — and worth reading next to the row they concern rather than
   * in a modal box that has to be dismissed before the table is visible.
   */
  const [actionError, setActionError] = useState<string | null>(null);

  const debouncedSearch = useDebounced(search);

  const {
    data: list,
    loading,
    error,
    refetch,
  } = useApiResource(
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

  /**
   * Reads the reason out of a failure.
   *
   * ApiError.detail rather than .message: a 422's top-level text is always
   * "The given data was invalid.", while the part worth reading — "used by 7
   * jobs, deactivate it instead" — sits in the field errors.
   */
  function describe(err: unknown, fallback: string): string {
    if (err instanceof ApiError) return err.detail;

    return err instanceof Error ? err.message : fallback;
  }

  async function toggle(item: TaxonomyItem) {
    setBusyId(item.id);
    setActionError(null);

    try {
      await api.toggleActive(item.id);
      refetch();
      refetchStats();
    } catch (err) {
      setActionError(describe(err, "Could not update the record."));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: TaxonomyItem) {
    setBusyId(item.id);
    setActionError(null);

    try {
      await api.remove(item.id);
      refetch();
      refetchStats();
      setConfirming(null);
    } catch (err) {
      setActionError(describe(err, "Could not delete the record."));
      setConfirming(null);
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
    <AdminShell active={navKey}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            <span className="text-slate-400">Dashboard</span> &gt; {title}
          </p>
        </div>
        <button
          onClick={() => setDialog({ mode: "create" })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2.5 text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New
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

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(stats.stats).map(([key, value]) => (
            <div
              key={key}
              className="bg-white rounded-2xl border border-slate-100 p-5"
            >
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
                    <td
                      colSpan={columns.length + 3}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      Loading…
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td
                      colSpan={columns.length + 3}
                      className="px-4 py-10 text-center"
                    >
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
                    <td
                      colSpan={columns.length + 3}
                      className="px-4 py-10 text-center text-slate-400"
                    >
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
                              style={{
                                backgroundColor: `${item.color ?? "#64748b"}1a`,
                              }}
                            >
                              {item.emoji ?? item.icon ?? item.flag_emoji}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 truncate">
                              {item.name}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {item.description ?? item.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {columns.map((c) => (
                        <td
                          key={c.header}
                          className="px-2 py-3.5 text-slate-500"
                        >
                          {c.render(item)}
                        </td>
                      ))}

                      <td className="px-2 py-3.5">
                        <button
                          onClick={() => toggle(item)}
                          disabled={busyId === item.id}
                          title={item.is_active ? "Deactivate" : "Activate"}
                          className={`flex items-center gap-1.5 text-xs font-medium disabled:opacity-40 ${
                            item.is_active
                              ? "text-emerald-600"
                              : "text-slate-400"
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
                            onClick={() => setDialog({ mode: "edit", item })}
                            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirming(item)}
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
                    <div
                      key={d.label}
                      className="flex items-center justify-between gap-2"
                    >
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
                    <span className="text-slate-700 truncate flex-1">
                      {t.label}
                    </span>
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
              <h2 className="font-semibold text-slate-900 mb-2 text-sm">
                Tips
              </h2>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                {tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900">
                  Delete &ldquo;{confirming.name}&rdquo;?
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  This cannot be undone. A record still attached to jobs or
                  companies will be refused — deactivate it instead.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirming(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => remove(confirming)}
                disabled={busyId === confirming.id}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busyId === confirming.id && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog && (
        <TaxonomyFormModal
          title={
            dialog.mode === "edit" ? `Edit ${singular}` : `Add ${singular}`
          }
          fields={fields}
          item={dialog.mode === "edit" ? dialog.item : null}
          onSubmit={(payload) =>
            dialog.mode === "edit"
              ? api.update(dialog.item.id, payload)
              : api.create(payload)
          }
          onClose={() => setDialog(null)}
          onSaved={() => {
            refetch();
            refetchStats();
          }}
        />
      )}
    </AdminShell>
  );
}
