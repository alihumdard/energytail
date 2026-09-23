"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  ExternalLink,
  Loader2,
  MousePointerClick,
  Pencil,
  Plus,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { employerJobs } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/useApiResource";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { EmployerJob } from "@/lib/api/types";
import RoleShell from "@/components/RoleShell";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  pending_review: "bg-amber-50 text-amber-700",
  expired: "bg-orange-50 text-orange-700",
  closed: "bg-red-50 text-red-700",
};

const TABS = [
  { label: "All", status: "" },
  { label: "Published", status: "published" },
  { label: "Drafts", status: "draft" },
  { label: "Expired", status: "expired" },
  { label: "Closed", status: "closed" },
];

function humanise(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function EmployerJobsPage() {
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: list, loading, refetch } = useApiResource(
    () => employerJobs.list({ status: tab || undefined, per_page: 50 }),
    [tab],
  );

  const { data: statsResponse, refetch: refetchStats } = useApiResource(
    () => employerJobs.stats(),
    [],
  );

  const jobs = list?.data ?? [];
  const stats = statsResponse?.data;

  async function act(job: EmployerJob, action: "close" | "reopen") {
    setBusyId(job.id);
    setActionError(null);

    try {
      await (action === "close"
        ? employerJobs.close(job.id)
        : employerJobs.reopen(job.id));

      refetch();
      refetchStats();
    } catch (err) {
      // ApiError.detail, not .message: a 422's top-level text is always
      // "The given data was invalid." and says nothing useful.
      setActionError(
        err instanceof ApiError ? err.detail : "Could not update the job.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!authLoading && user && !user.roles.includes("employer") && !user.roles.includes("administrator")) {
    return (
      <RoleShell role="employer">
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-slate-900">Employers only</h1>
          <p className="mt-2 text-slate-500">This area needs an employer account.</p>
        </main>
      </RoleShell>
    );
  }

  return (
    <RoleShell role="employer">

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
            <p className="mt-1 text-sm text-slate-500">
              Your listings and how they are performing.
            </p>
          </div>

          <Link
            href="/employer/jobs/new"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Post a Job
          </Link>
        </div>

        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Total" value={stats.total} />
            <Stat label="Published" value={stats.published} />
            <Stat label="Drafts" value={stats.draft} />
            {/*
              Views and clicks are what an employer gets instead of applicant
              tracking: applications are completed on their own site, so the
              platform can only report interest, never outcomes.
            */}
            <Stat label="Views" value={stats.views} icon={Eye} />
            <Stat label="Apply clicks" value={stats.apply_clicks} icon={MousePointerClick} />
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {actionError}
          </div>
        )}

        <div className="mt-6 flex gap-5 overflow-x-auto border-b border-slate-100">
          {TABS.map((t) => (
            <button
              key={t.label}
              onClick={() => setTab(t.status)}
              className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium ${
                tab === t.status
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {loading && (
            <p className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-400">
              Loading your jobs…
            </p>
          )}

          {!loading && jobs.length === 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
              <p className="font-medium text-slate-700">Nothing here yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Post your first job and it will appear on the board straight away.
              </p>
              <Link
                href="/employer/jobs/new"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Post a Job
              </Link>
            </div>
          )}

          {jobs.map((job) => (
            <article
              key={job.id}
              className="rounded-2xl border border-slate-100 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        STATUS_STYLE[job.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {humanise(job.status)}
                    </span>
                    {job.reference && (
                      <span className="font-mono text-xs text-slate-400">
                        {job.reference}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-1 truncate font-semibold text-slate-900">
                    {job.title}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      {job.views_count.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MousePointerClick className="h-4 w-4" />
                      {job.apply_clicks_count.toLocaleString()} apply clicks
                    </span>
                    {job.deadline_at && (
                      <span>
                        Closes{" "}
                        {new Date(job.deadline_at).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {job.status === "published" && (
                    <Link
                      href={`/jobs/${job.slug}`}
                      target="_blank"
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </Link>
                  )}

                  <Link
                    href={`/employer/jobs/${job.id}/edit`}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>

                  {job.status === "closed" || job.status === "expired" ? (
                    <button
                      onClick={() => act(job, "reopen")}
                      disabled={busyId === job.id}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                    >
                      {busyId === job.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Reopen
                    </button>
                  ) : (
                    <button
                      onClick={() => act(job, "close")}
                      disabled={busyId === job.id}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {busyId === job.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Close
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </RoleShell>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon?: typeof Eye;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
