"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import JobForm from "@/components/employer/JobForm";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Post a job.
 *
 * A client component: this is a form behind a login, so there is nothing for
 * a crawler to index and no reason to render it on the server. The form
 * itself is shared with the edit page.
 */
export default function PostJobPage() {
  const { user, loading: authLoading } = useAuth();
  const [done, setDone] = useState<{ title: string; status: string } | null>(null);

  /*
   * Bumped by "Post another" to remount the form. The form seeds its state
   * once, so without a new key the next posting would open pre-filled with
   * the job just submitted.
   */
  const [formKey, setFormKey] = useState(0);

  if (!authLoading && user && !user.roles.includes("employer") && !user.roles.includes("administrator")) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-slate-900">Employers only</h1>
          <p className="mt-2 text-slate-500">
            Posting a job needs an employer account.
          </p>
          <Link
            href="/register?role=employer"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Register as an employer
          </Link>
        </main>
      </>
    );
  }

  if (done) {
    // Three outcomes, not two: a draft is neither live nor waiting on a
    // moderator, and saying "sent for review" would leave the employer
    // expecting an approval that never comes.
    const message =
      done.status === "published"
        ? "It is live on the board now."
        : done.status === "pending_review"
          ? "It has been sent for review and will go live once approved."
          : "It has been saved as a draft — publish it when you are ready.";

    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h1 className="mt-3 text-xl font-bold text-slate-900">
              &ldquo;{done.title}&rdquo; saved
            </h1>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/employer/jobs"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                View my jobs
              </Link>
              <button
                type="button"
                onClick={() => {
                  setFormKey((n) => n + 1);
                  setDone(null);
                }}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Post another
              </button>
            </div>
          </div>
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

        <JobForm key={formKey} onSaved={setDone} />
      </main>
    </>
  );
}
