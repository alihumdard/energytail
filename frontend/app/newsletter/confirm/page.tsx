"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { ApiError } from "@/lib/api/client";
import { newsletter } from "@/lib/api/endpoints";

/**
 * The destination of the confirmation link.
 *
 * The token is spent on first use, so this page has to distinguish "confirmed
 * just now" from "this link has already been used" without alarming someone
 * who simply clicked twice.
 */
function NewsletterConfirmContent() {
  const token = useSearchParams().get("token");

  const [result, setResult] = useState<{ state: "done" | "failed"; message: string } | null>(null);

  /*
   * A missing token is knowable during render, so it is derived rather than
   * written from an effect — setState in an effect fights React and the lint
   * rule that guards against it.
   */
  const state = token === null ? "failed" : (result?.state ?? "working");
  const message =
    token === null
      ? "That link is missing its confirmation code."
      : (result?.message ?? "");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    newsletter
      .confirm(token)
      .then(({ message }) => {
        if (!cancelled) setResult({ state: "done", message });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult({
          state: "failed",
          message:
            err instanceof ApiError
              ? err.detail
              : "Could not reach the server. Try the link again shortly.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center px-4 py-20 text-center">
        {state === "working" && (
          <>
            <Loader2 className="h-9 w-9 animate-spin text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">Confirming your subscription…</p>
          </>
        )}

        {state === "done" && (
          <>
            <CheckCircle2 className="h-11 w-11 text-emerald-500" />
            <h1 className="mt-4 text-xl font-bold text-slate-900">You are subscribed</h1>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <Link
              href="/jobs"
              className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Browse jobs
            </Link>
          </>
        )}

        {state === "failed" && (
          <>
            <XCircle className="h-11 w-11 text-slate-300" />
            <h1 className="mt-4 text-xl font-bold text-slate-900">
              This link is no longer valid
            </h1>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <p className="mt-2 text-sm text-slate-400">
              If you already confirmed, you are on the list — nothing more to do.
            </p>
            <Link
              href="/"
              className="mt-6 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Back to Energy Tail
            </Link>
          </>
        )}
      </main>
    </>
  );
}

/**
 * useSearchParams() opts a component into client-side rendering, which Next
 * cannot prerender without a Suspense boundary to fall back to. The token is
 * only readable in the browser anyway, so the boundary sits here and the
 * shell around it stays static.
 */
export default function NewsletterConfirmPage() {
  return (
    <Suspense
      fallback={
        <>
          <SiteHeader />
          <main className="mx-auto flex max-w-lg flex-1 flex-col items-center px-4 py-20 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">Confirming your subscription…</p>
          </main>
        </>
      }
    >
      <NewsletterConfirmContent />
    </Suspense>
  );
}
