"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  Loader2,
  MousePointerClick,
  Plus,
  Search,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { ApiError } from "@/lib/api/client";
import { adminJobs } from "@/lib/api/endpoints";
import { useApiResource, useDebounced } from "@/lib/hooks/useApiResource";
import type { AdminJob } from "@/lib/api/types";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  pending_review: "bg-blue-50 text-blue-700",
  expired: "bg-orange-50 text-orange-700",
  closed: "bg-red-50 text-red-700",
};

const TABS = [
  { label: "All", status: "" },
  { label: "Pending Review", status: "pending_review" },
  { label: "Published", status: "published" },
  { label: "Drafts", status: "draft" },
  { label: "Expired", status: "expired" },
  { label: "Closed", status: "closed" },
];

function humanise(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminJobsPage() {
  const [tab, setTab] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminJob | null>(null);
  const [reason, setReason] = useState("");

  const debouncedSearch = useDebounced(search);

  const {
    data: list,
    loading,
    refetch,
  } = useApiResource(
    () =>
      adminJobs.list({
        status: tab || undefined,
        search: debouncedSearch || undefined,
        page,
        per_page: 20,
      }),
    [tab, debouncedSearch, page],
  );

  const { data: statsResponse, refetch: refetchStats } = useApiResource(
    () => adminJobs.stats(),
    [],
  );

  const jobs = list?.data ?? [];
  const meta = list?.meta;
  const stats = statsResponse?.data.stats;

  async function run(job: AdminJob, work: () => Promise<unknown>) {
    setBusyId(job.id);
    setActionError(null);

    try {
      await work();
      refetch();
      refetchStats();
    } catch (err) {
      // ApiError.detail, not .message: a 422's top-level text is always
      // "The given data was invalid." and explains nothing.
      setActionError(
        err instanceof ApiError ? err.detail : "Could not update the job.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject() {
    if (!rejecting) return;

    const job = rejecting;
    const text = reason;

    setRejecting(null);
    setReason("");

    await run(job, () => adminJobs.reject(job.id, text));
  }

  return (
    <AdminShell active="jobs">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jobs Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            <span className="text-slate-400">Dashboard</span> &gt; Jobs
          </p>
        </div>

        <Link
          href="/employer/jobs/new"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Post New Job
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total" value={stats.total} />
          <Stat label="Published" value={stats.published} />
          <Stat label="Pending Review" value={stats.pending_review} />
          <Stat label="Drafts" value={stats.draft} />
          <Stat label="Expired" value={stats.expired} />
          <Stat label="Featured" value={stats.featured} />
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {actionError}
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex gap-5 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.label}
                onClick={() => {
                  setTab(t.status);
                  setPage(1);
                }}
                className={`-mb-4 whitespace-nowrap border-b-2 pb-4 text-sm font-medium ${
                  tab === t.status
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Title, reference or company…"
              className="rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {loading && (
            <p className="p-10 text-center text-slate-400">Loading jobs…</p>
          )}

          {!loading && jobs.length === 0 && (
            <p className="p-10 text-center text-slate-400">
              No jobs match these filters.
            </p>
          )}

          {jobs.map((job) => (
            <div key={job.id} className="flex flex-wrap items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      STATUS_STYLE[job.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {humanise(job.status)}
                  </span>
                  {job.is_featured && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      <Star className="h-3 w-3" />
                      Featured
                    </span>
                  )}
                  {job.reference && (
                    <span className="font-mono text-xs text-slate-400">
                      {job.reference}
                    </span>
                  )}
                </div>

                <h2 className="mt-1 truncate font-semibold text-slate-900">
                  {job.title}
                </h2>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  {job.company && (
                    <span className="flex items-center gap-1 truncate">
                      <BadgeCheck className="h-3.5 w-3.5 text-slate-300" />
                      {job.company.name}
                    </span>
                  )}
                  {job.country && (
                    <span>
                      {job.city?.name ? `${job.city.name}, ` : ""}
                      {job.country.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {job.views_count.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="h-3.5 w-3.5" />
                    {job.apply_clicks_count.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                {job.status === "published" && (
                  <Link
                    href={`/jobs/${job.slug}`}
                    target="_blank"
                    title="View on the site"
                    className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}

                <button
                  onClick={() =>
                    run(job, () => adminJobs.toggleFeatured(job.id))
                  }
                  disabled={busyId === job.id}
                  title={
                    job.is_featured ? "Remove featured" : "Feature this job"
                  }
                  className={`rounded-md p-2 disabled:opacity-40 ${
                    job.is_featured
                      ? "text-amber-500 hover:bg-amber-50"
                      : "text-slate-400 hover:bg-slate-100 hover:text-amber-500"
                  }`}
                >
                  <Star className="h-4 w-4" />
                </button>

                {job.status !== "published" && (
                  <button
                    onClick={() => run(job, () => adminJobs.approve(job.id))}
                    disabled={busyId === job.id}
                    title="Publish"
                    className="rounded-md p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
                  >
                    {busyId === job.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </button>
                )}

                {job.status !== "closed" && (
                  <button
                    onClick={() => setRejecting(job)}
                    disabled={busyId === job.id}
                    title="Take off the board"
                    className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={() => run(job, () => adminJobs.remove(job.id))}
                  disabled={busyId === job.id}
                  title="Delete"
                  className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4 text-sm">
            <span className="text-slate-500">
              Page {meta.current_page} of {meta.last_page} · {meta.total} jobs
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page >= meta.last_page}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {rejecting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="font-semibold text-slate-900">
              Take &ldquo;{rejecting.title}&rdquo; off the board?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {/* Closed rather than deleted: the employer paid for the
                  placement and its view history is their analytics. */}
              The listing is closed, not deleted. The reason goes into the audit
              log so the employer can be told why.
            </p>

            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this being removed?"
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejecting(null);
                  setReason("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={reason.trim() === ""}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
