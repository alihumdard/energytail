"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import JobForm from "@/components/employer/JobForm";
import { ApiError } from "@/lib/api/client";
import { employerJobs } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { EmployerJob } from "@/lib/api/types";

/**
 * Edit an existing listing.
 *
 * The form itself is shared with the post page — same fields, same rules —
 * so the only work here is loading the job and handling the ways that can
 * fail: someone else's job, a deleted one, or a signed-out session.
 */
export default function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();

  const [job, setJob] = useState<EmployerJob | null>(null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState<{ title: string; status: string } | null>(null);

  useEffect(() => {
    // Wait for the session: requesting before the cookie is confirmed would
    // 401 and show "not allowed" to someone who is perfectly entitled to edit.
    if (authLoading || !user) return;

    let cancelled = false;

    employerJobs
      .get(Number(id))
      .then(({ data }) => {
        if (!cancelled) setJob(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError ? err : new ApiError(0, "Could not reach the server."),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading]);

  if (!authLoading && user && !user.roles.includes("employer") && !user.roles.includes("administrator")) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-slate-900">Employers only</h1>
          <p className="mt-2 text-slate-500">
            Editing a job needs an employer account.
          </p>
        </main>
      </>
    );
  }

  if (saved) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h1 className="mt-3 text-xl font-bold text-slate-900">Changes saved</h1>
            <p className="mt-2 text-sm text-slate-600">
              &ldquo;{saved.title}&rdquo; has been updated.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/employer/jobs"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Back to my jobs
              </Link>
              <button
                type="button"
                onClick={() => setSaved(null)}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Keep editing
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (loadError) {
    /*
     * The API answers 403 for a job belonging to another company and 404 for
     * one that does not exist. Both are reported the same way on purpose:
     * distinguishing them would confirm that a given job id exists.
     */
    const notYours = loadError.status === 403 || loadError.status === 404;

    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            {notYours ? "Job not found" : "Could not load this job"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {notYours
              ? "This listing does not exist, or it belongs to another company."
              : loadError.detail}
          </p>
          <Link
            href="/employer/jobs"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to my jobs
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link
          href="/employer/jobs"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my jobs
        </Link>

        {job ? (
          /*
           * Keyed by id so switching jobs remounts the form. Without it React
           * would keep the previous job's field state, because the form seeds
           * itself from the prop only on first render.
           */
          <JobForm key={job.id} job={job} onSaved={setSaved} />
        ) : (
          <div className="flex items-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading the job…
          </div>
        )}
      </main>
    </>
  );
}
