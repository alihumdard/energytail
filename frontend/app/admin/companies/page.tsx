"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  Search,
  ShieldAlert,
  Star,
  XCircle,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { ApiError } from "@/lib/api/client";
import { adminCompanies } from "@/lib/api/endpoints";
import { useApiResource, useDebounced } from "@/lib/hooks/useApiResource";
import type { AdminCompany } from "@/lib/api/types";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-blue-50 text-blue-700",
  suspended: "bg-red-50 text-red-700",
  inactive: "bg-slate-100 text-slate-600",
};

const TABS = [
  { label: "All", status: "" },
  { label: "Pending", status: "pending" },
  { label: "Active", status: "active" },
  { label: "Suspended", status: "suspended" },
  { label: "Inactive", status: "inactive" },
];

function humanise(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminCompaniesPage() {
  const [tab, setTab] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<AdminCompany | null>(null);
  const [reason, setReason] = useState("");

  const debouncedSearch = useDebounced(search);

  const {
    data: list,
    loading,
    refetch,
  } = useApiResource(
    () =>
      adminCompanies.list({
        status: tab || undefined,
        search: debouncedSearch || undefined,
        page,
        per_page: 20,
      }),
    [tab, debouncedSearch, page],
  );

  const { data: statsResponse, refetch: refetchStats } = useApiResource(
    () => adminCompanies.stats(),
    [],
  );

  const companies = list?.data ?? [];
  const meta = list?.meta;
  const stats = statsResponse?.data.stats;

  async function run(company: AdminCompany, work: () => Promise<unknown>) {
    setBusyId(company.id);
    setActionError(null);

    try {
      await work();
      refetch();
      refetchStats();
    } catch (err) {
      // ApiError.detail, not .message: a 422's top-level text is always
      // "The given data was invalid." and explains nothing.
      setActionError(
        err instanceof ApiError ? err.detail : "Could not update the company.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function confirmSuspend() {
    if (!suspending) return;

    const company = suspending;
    const text = reason;

    setSuspending(null);
    setReason("");

    await run(company, () => adminCompanies.suspend(company.id, text));
  }

  const cards = [
    {
      label: "Total Companies",
      value: stats?.total,
      icon: Building2,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Active",
      value: stats?.active,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Verified",
      value: stats?.verified,
      icon: BadgeCheck,
      tone: "bg-violet-50 text-violet-600",
    },
    {
      label: "Pending Review",
      value: stats?.pending,
      icon: ShieldAlert,
      tone: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <AdminShell active="companies">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approve, verify and suspend the companies posting on the board.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-sm text-slate-500">{c.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {c.value === undefined ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                  ) : (
                    c.value.toLocaleString()
                  )}
                </p>
              </div>
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${c.tone}`}
              >
                <c.icon size={20} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {actionError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white">
        {/* Tabs + search */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  setTab(t.status);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  tab === t.status
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Name, email or website…"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        {loading && companies.length === 0 ? (
          <div className="flex items-center gap-2 p-10 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading companies…
          </div>
        ) : companies.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No companies match this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Jobs</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => {
                  const busy = busyId === c.id;

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800">{c.name}</p>
                          {c.is_verified && (
                            <BadgeCheck
                              size={14}
                              className="shrink-0 text-blue-500"
                            />
                          )}
                          {c.is_featured && (
                            <Star
                              size={13}
                              className="shrink-0 fill-amber-400 text-amber-400"
                            />
                          )}
                        </div>
                        {c.website && (
                          <a
                            href={c.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600"
                          >
                            <Globe size={11} />
                            {c.website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {c.owner ? (
                          <>
                            <p className="text-slate-700">{c.owner.name}</p>
                            <p className="text-xs text-slate-400">
                              {c.owner.email}
                            </p>
                          </>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        {[c.city?.name, c.country?.name]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Briefcase size={13} className="text-slate-400" />
                          {c.jobs_count}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            STATUS_STYLE[c.status] ??
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {humanise(c.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : (
                            <>
                              <button
                                type="button"
                                title={
                                  c.is_verified
                                    ? "Remove verification"
                                    : "Verify company"
                                }
                                onClick={() =>
                                  run(c, () =>
                                    adminCompanies.toggleVerified(c.id),
                                  )
                                }
                                className={`rounded p-1.5 hover:bg-slate-100 ${
                                  c.is_verified
                                    ? "text-blue-500"
                                    : "text-slate-300"
                                }`}
                              >
                                <BadgeCheck size={16} />
                              </button>

                              <button
                                type="button"
                                title={
                                  c.is_featured
                                    ? "Unfeature"
                                    : "Feature on homepage"
                                }
                                onClick={() =>
                                  run(c, () =>
                                    adminCompanies.toggleFeatured(c.id),
                                  )
                                }
                                className={`rounded p-1.5 hover:bg-slate-100 ${
                                  c.is_featured
                                    ? "text-amber-500"
                                    : "text-slate-300"
                                }`}
                              >
                                <Star size={16} />
                              </button>

                              {c.status !== "active" && (
                                <button
                                  type="button"
                                  title="Approve"
                                  onClick={() =>
                                    run(c, () => adminCompanies.approve(c.id))
                                  }
                                  className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}

                              {c.status !== "suspended" && (
                                <button
                                  type="button"
                                  title="Suspend"
                                  onClick={() => setSuspending(c)}
                                  className="rounded p-1.5 text-red-500 hover:bg-red-50"
                                >
                                  <XCircle size={16} />
                                </button>
                              )}

                              <Link
                                href={`/companies/${c.slug}`}
                                target="_blank"
                                title="View public page"
                                className="rounded p-1.5 text-slate-400 hover:bg-slate-100"
                              >
                                <ExternalLink size={16} />
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4 text-sm">
            <p className="text-slate-500">
              Page {meta.current_page} of {meta.last_page} · {meta.total}{" "}
              companies
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Suspend dialog — a reason is required, and it lands in the audit log. */}
      {suspending && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Suspend {suspending.name}?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Their listings stay on record. The reason is written to the audit
              log so anyone reviewing this later can see why.
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why is this company being suspended?"
              className="mt-4 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-400 focus:outline-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSuspending(null);
                  setReason("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reason.trim() === ""}
                onClick={confirmSuspend}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
