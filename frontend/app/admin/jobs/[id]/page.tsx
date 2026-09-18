"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  Eye,
  Loader2,
  MapPin,
  MousePointerClick,
  Star,
  XCircle,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { ApiError } from "@/lib/api/client";
import { adminJobs } from "@/lib/api/endpoints";
import type { AdminJob } from "@/lib/api/types";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  pending_review: "bg-blue-50 text-blue-700",
  expired: "bg-orange-50 text-orange-700",
  closed: "bg-red-50 text-red-700",
};

function humanise(value: string | null): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * One job, for moderation.
 *
 * The list page carries the same actions, but a moderator deciding whether to
 * pull a listing needs to read it first rather than judge it by its title.
 */
export default function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [job, setJob] = useState<AdminJob | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let cancelled = false;

    /*
     * There is no admin job detail endpoint, so the row comes from the list
     * filtered to this id. Building a second endpoint that returns what the
     * list already returns would be two sources of truth for one shape.
     */
    adminJobs
      .list({ per_page: 100 })
      .then(({ data }) => {
        if (cancelled) return;
        const match = data.find((j) => j.id === Number(id));
        if (match) setJob(match);
        else setLoadError("This job could not be found.");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError ? err.detail : "Could not load the job.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function run(work: () => Promise<{ data: AdminJob }>) {
    setBusy(true);
    setActionError(null);

    try {
      const { data } = await work();
      setJob(data);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.detail : "Could not update the job.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell active="jobs">
      <Link
        href="/admin/jobs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        All jobs
      </Link>

      {loadError ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-500">{loadError}</p>
        </div>
      ) : !job ? (
        <div className="flex items-center gap-2 py-16 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading the job…
        </div>
      ) : (
        <>
          {actionError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {actionError}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="min-w-0 space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900">
                      {job.title}
                      {job.is_featured && (
                        <Star
                          size={18}
                          className="fill-amber-400 text-amber-400"
                        />
                      )}
                    </h1>
                    <p className="mt-1 font-mono text-xs text-slate-400">
                      {job.reference}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      STATUS_STYLE[job.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {humanise(job.status)}
                  </span>
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    ["Company", job.company?.name ?? "—"],
                    ["Category", job.category?.name ?? "—"],
                    ["Employment type", humanise(job.employment_type)],
                    [
                      "Location",
                      job.is_remote
                        ? "Remote"
                        : (job.location_label ??
                          [job.city?.name, job.country?.name]
                            .filter(Boolean)
                            .join(", ") ??
                          "—"),
                    ],
                    ["Published", formatDate(job.published_at)],
                    ["Closes", formatDate(job.deadline_at)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-slate-400">{label}</dt>
                      <dd className="mt-0.5 text-sm text-slate-700">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-4 font-semibold text-slate-900">
                  Performance
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Eye size={13} /> Views
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {job.views_count.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MousePointerClick size={13} /> Apply clicks
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {job.apply_clicks_count.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Click-through</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {job.views_count > 0
                        ? `${((job.apply_clicks_count / job.views_count) * 100).toFixed(1)}%`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Moderation */}
            <aside className="min-w-0 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-3 font-semibold text-slate-900">
                  Moderation
                </h2>

                <div className="space-y-2">
                  {job.status !== "published" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => adminJobs.approve(job.id))}
                      className="flex w-full items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} /> Approve &amp; publish
                    </button>
                  )}

                  {job.status !== "closed" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setRejecting(true)}
                      className="flex w-full items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle size={15} /> Remove from board
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => adminJobs.toggleFeatured(job.id))}
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Star
                      size={15}
                      className={
                        job.is_featured ? "fill-amber-400 text-amber-400" : ""
                      }
                    />
                    {job.is_featured ? "Remove feature" : "Feature this job"}
                  </button>
                </div>

                {busy && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin" /> Working…
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-3 font-semibold text-slate-900">Links</h2>
                <div className="space-y-2 text-sm">
                  <Link
                    href={`/jobs/${job.slug}`}
                    target="_blank"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink size={14} /> Public job page
                  </Link>
                  {job.company && (
                    <Link
                      href={`/companies/${job.company.slug}`}
                      target="_blank"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <Building2 size={14} /> Company page
                    </Link>
                  )}
                  <Link
                    href={`/employer/jobs/${job.id}/edit`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <MapPin size={14} /> Edit this listing
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}

      {/* Reject dialog — the reason lands in the audit log. */}
      {rejecting && job && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Remove from the board?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The listing keeps its URL and view history — the employer paid for
              the placement. The reason is written to the audit log.
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why is this listing being pulled?"
              className="mt-4 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-400 focus:outline-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejecting(false);
                  setReason("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reason.trim() === ""}
                onClick={() => {
                  const text = reason;
                  setRejecting(false);
                  setReason("");
                  run(() => adminJobs.reject(job.id, text));
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
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
