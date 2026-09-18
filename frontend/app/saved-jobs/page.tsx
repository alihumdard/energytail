"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Loader2, MapPin, Search, Trash2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { ApiError } from "@/lib/api/client";
import { seeker } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/useApiResource";
import { useAuth } from "@/lib/auth/AuthProvider";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SavedJobsPage() {
  const { user, loading: authLoading } = useAuth();

  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: list, loading, refetch } = useApiResource(
    () => seeker.savedJobs({ page, per_page: 20 }),
    [page],
  );

  const saved = list?.data ?? [];
  const meta = list?.meta;

  async function remove(jobId: number) {
    setBusyId(jobId);
    setError(null);

    try {
      await seeker.unsaveJob(jobId);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not remove the job.");
    } finally {
      setBusyId(null);
    }
  }

  if (!authLoading && !user) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-slate-900">Sign in to see your saved jobs</h1>
          <Link
            href="/login?redirect=/saved-jobs"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Sign in
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Saved Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Jobs you bookmarked. Closed listings stay here until you remove them.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white">
          {loading && saved.length === 0 ? (
            <div className="flex items-center gap-2 p-10 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your saved jobs…
            </div>
          ) : saved.length === 0 ? (
            <div className="p-12 text-center">
              <Bookmark className="mx-auto h-10 w-10 text-slate-200" />
              <p className="mt-3 text-slate-500">You have not saved any jobs yet.</p>
              <Link
                href="/jobs"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Search size={16} /> Browse the board
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {saved.map((s) =>
                s.job === null ? null : (
                  <li key={s.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/jobs/${s.job.slug}`}
                            className="font-semibold text-slate-900 hover:text-blue-600"
                          >
                            {s.job.title}
                          </Link>
                          {!s.job.is_open && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                              Closed
                            </span>
                          )}
                        </div>

                        <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {s.job.company && (
                            <Link
                              href={`/companies/${s.job.company.slug}`}
                              className="hover:text-blue-600"
                            >
                              {s.job.company.name}
                            </Link>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={11} />
                            {s.job.is_remote ? "Remote" : s.job.location_label ?? "—"}
                          </span>
                          <span>Saved {formatDate(s.saved_at)}</span>
                        </p>

                        {s.note && (
                          <p className="mt-2 rounded border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                            {s.note}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {s.job.is_open && (
                          <Link
                            href={`/jobs/${s.job.slug}`}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            View
                          </Link>
                        )}
                        {busyId === s.job.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : (
                          <button
                            type="button"
                            title="Remove from saved"
                            onClick={() => s.job && remove(s.job.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 p-4 text-sm">
              <p className="text-slate-500">
                Page {meta.current_page} of {meta.last_page} · {meta.total} saved
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
      </main>
    </>
  );
}
