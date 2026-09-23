"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Star,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { billing } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { BillingOverview, Plan } from "@/lib/api/types";
import RoleShell from "@/components/RoleShell";

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700" },
  trialing: { label: "Trial", className: "bg-blue-50 text-blue-700" },
  past_due: { label: "Payment failed", className: "bg-amber-50 text-amber-700" },
  canceled: { label: "Cancelled", className: "bg-slate-100 text-slate-600" },
  unpaid: { label: "Unpaid", className: "bg-red-50 text-red-700" },
  incomplete: { label: "Incomplete", className: "bg-slate-100 text-slate-600" },
};

function BillingPageContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const checkout = searchParams.get("checkout");

  async function load() {
    const [o, p] = await Promise.all([billing.overview(), billing.plans()]);
    setOverview(o.data);
    setPlans(p.data);
  }

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    Promise.all([billing.overview(), billing.plans()])
      .then(([o, p]) => {
        if (cancelled) return;
        setOverview(o.data);
        setPlans(p.data);
      })
      .catch(() => {
        if (!cancelled) setPlans([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  async function choose(slug: string) {
    setBusy(slug);
    setError(null);
    setNotice(null);

    try {
      const { message, data } = await billing.subscribe(slug);

      /*
       * A paid plan returns a Stripe URL to follow; a free one is assigned
       * outright and returns none. Handling both here keeps the button the
       * same for the employer either way.
       */
      if (data.checkout_url) {
        // assign(), not location.href: the lint rule treats the href setter
        // as a mutation, and this is a navigation either way.
        window.location.assign(data.checkout_url);
        return;
      }

      setNotice(message ?? "Your plan has been updated.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not change your plan.");
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    setCancelling(false);
    setBusy("cancel");
    setError(null);

    try {
      const { message } = await billing.cancel();
      setNotice(message ?? "Your subscription has been cancelled.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not cancel.");
    } finally {
      setBusy(null);
    }
  }

  if (!authLoading && user && !user.roles.includes("employer") && !user.roles.includes("administrator")) {
    return (
      <RoleShell role="employer">
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-slate-900">Employers only</h1>
          <p className="mt-2 text-slate-500">Billing needs an employer account.</p>
        </main>
      </RoleShell>
    );
  }

  const subscription = overview?.subscription ?? null;
  const status = subscription ? STATUS_LABEL[subscription.status] : null;

  return (
    <RoleShell role="employer">

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your plan, your posting allowance and your invoices.
        </p>

        {checkout === "success" && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Payment received. Your plan is being activated — it may take a
            moment to appear here.
          </div>
        )}
        {checkout === "cancelled" && (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Checkout was cancelled. Nothing has been charged.
          </div>
        )}

        {notice && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Stripe not configured — say so rather than offering a dead button. */}
        {overview && !overview.stripe_ready && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>
              Card payments are not switched on yet. Free plans work; paid
              plans will be available once Stripe is connected.
            </span>
          </div>
        )}

        {!overview ? (
          <div className="flex items-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : overview.company === null ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-500">
              Set up your company profile before choosing a plan.
            </p>
            <Link
              href="/employer/company-profile"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Company profile
            </Link>
          </div>
        ) : (
          <>
            {/* Current plan */}
            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Current plan</h2>

              {subscription === null ? (
                <p className="mt-2 text-sm text-slate-500">
                  You are not on a plan yet. Choose one below.
                </p>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="text-xl font-bold text-slate-900">
                      {subscription.plan?.name ?? "—"}
                    </span>
                    {status && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    )}
                    {subscription.on_grace_period && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Ends {formatDate(subscription.cancels_at)}
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Job postings used</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {subscription.jobs_used}
                        {subscription.plan?.job_limit !== null && (
                          <span className="text-sm font-normal text-slate-400">
                            {" "}
                            of {subscription.plan?.job_limit}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {subscription.jobs_remaining === null
                          ? "Unlimited"
                          : `${subscription.jobs_remaining} left this period`}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Featured listings</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {subscription.featured_used}
                        <span className="text-sm font-normal text-slate-400">
                          {" "}
                          of {subscription.plan?.featured_job_limit ?? 0}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Renews</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {formatDate(subscription.current_period_end)}
                      </p>
                    </div>
                  </div>

                  {subscription.is_valid && !subscription.on_grace_period && (
                    <button
                      type="button"
                      onClick={() => setCancelling(true)}
                      disabled={busy !== null}
                      className="mt-4 text-sm font-medium text-slate-500 hover:text-red-600 disabled:opacity-50"
                    >
                      Cancel subscription
                    </button>
                  )}
                </>
              )}
            </section>

            {/* Plans */}
            <section className="mt-6">
              <h2 className="mb-4 font-semibold text-slate-900">
                {subscription ? "Change plan" : "Choose a plan"}
              </h2>

              {plans === null ? (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {plans.map((plan) => {
                    const isCurrent = subscription?.plan?.slug === plan.slug;

                    return (
                      <div
                        key={plan.id}
                        className={`flex flex-col rounded-xl border bg-white p-5 ${
                          isCurrent ? "border-emerald-400 ring-1 ring-emerald-400" : "border-slate-200"
                        }`}
                      >
                        <h3 className="font-bold text-slate-900">{plan.name}</h3>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {plan.is_free ? "Free" : formatPrice(plan.price_cents, plan.currency)}
                          {!plan.is_free && (
                            <span className="text-sm font-normal text-slate-400">
                              /{plan.interval}
                            </span>
                          )}
                        </p>

                        <ul className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500">
                          <li className="flex items-start gap-1.5">
                            <Check size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                            {plan.job_limit === null
                              ? "Unlimited postings"
                              : `${plan.job_limit} posting${plan.job_limit === 1 ? "" : "s"}/month`}
                          </li>
                          {plan.featured_job_limit > 0 && (
                            <li className="flex items-start gap-1.5">
                              <Star size={12} className="mt-0.5 shrink-0 text-amber-400" />
                              {plan.featured_job_limit} featured
                            </li>
                          )}
                          <li className="flex items-start gap-1.5">
                            <Check size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                            {plan.job_duration_days}-day listings
                          </li>
                        </ul>

                        {isCurrent ? (
                          <span className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                            <CheckCircle2 size={14} /> Current plan
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => choose(plan.slug)}
                            disabled={busy !== null || (!plan.is_free && !overview.stripe_ready)}
                            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                          >
                            {busy === plan.slug && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {plan.is_free ? "Switch to free" : "Choose"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Invoices */}
            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 font-semibold text-slate-900">Invoices</h2>

              {overview.payments.length === 0 ? (
                <p className="text-sm text-slate-500">No payments yet.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {overview.payments.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800">
                          {formatPrice(p.amount_cents, p.currency)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDate(p.paid_at ?? p.created_at)}
                        </p>
                        {/* Stripe's own decline reason, unparaphrased. */}
                        {p.failure_reason && (
                          <p className="mt-1 text-xs text-red-600">{p.failure_reason}</p>
                        )}
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          p.status === "succeeded"
                            ? "bg-emerald-50 text-emerald-700"
                            : p.status === "failed"
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.status}
                      </span>

                      {p.invoice_pdf_url && (
                        <a
                          href={p.invoice_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100"
                          title="Download invoice"
                        >
                          <Download size={15} />
                        </a>
                      )}
                      {p.invoice_url && (
                        <a
                          href={p.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100"
                          title="View invoice"
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      {cancelling && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Cancel your subscription?</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your plan stays active until{" "}
              {formatDate(subscription?.current_period_end ?? null)} — you keep
              what you have paid for. Your listings are not removed.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelling(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={cancel}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Cancel subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleShell>
  );
}

/**
 * useSearchParams() opts a component into client-side rendering, and Next
 * refuses to prerender one that is not inside a Suspense boundary — it has no
 * markup to emit for the server pass. Wrapping the reader here keeps the page
 * statically prerenderable and gives the browser something to show while the
 * query string is resolved.
 */
export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
