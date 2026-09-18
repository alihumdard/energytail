import Link from "next/link";
import type { Metadata } from "next";
import { Check, Star } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { DarkFooter } from "@/components/Shared";
import { fetchPublic } from "@/lib/api/server";
import type { Plan } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Pricing for Employers",
  description:
    "Post oil, gas and renewable energy jobs to a specialist audience. Plans from free to unlimited.",
};

/**
 * Formats cents for display.
 *
 * The API sends cents as an integer on purpose — floats cannot represent
 * 99.00 exactly — so the division happens here, at the last possible moment.
 */
function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export default async function PricingPage() {
  const { data: plans } = await fetchPublic<{ data: Plan[] }>("/plans", {
    // Prices change rarely, and a stale price on a pricing page is worse
    // than a slightly slower one.
    revalidate: 300,
  });

  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-slate-50">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-12 text-center">
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Reach energy professionals
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
              Post your roles to a specialist audience of oil, gas and renewable
              energy candidates. Start free, upgrade when you are hiring.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-4 sm:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
                  plan.is_popular
                    ? "border-blue-500 shadow-lg ring-1 ring-blue-500"
                    : "border-slate-200"
                }`}
              >
                {plan.is_popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                    Most popular
                  </span>
                )}

                <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
                {plan.description && (
                  <p className="mt-1 min-h-[40px] text-sm text-slate-500">
                    {plan.description}
                  </p>
                )}

                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {plan.is_free ? "Free" : formatPrice(plan.price_cents, plan.currency)}
                  </span>
                  {!plan.is_free && (
                    <span className="text-sm text-slate-400">/{plan.interval}</span>
                  )}
                </p>

                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  <li className="flex items-start gap-2 text-slate-600">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                    {plan.job_limit === null
                      ? "Unlimited job postings"
                      : `${plan.job_limit} job posting${plan.job_limit === 1 ? "" : "s"} per month`}
                  </li>

                  {plan.featured_job_limit > 0 && (
                    <li className="flex items-start gap-2 text-slate-600">
                      <Star size={15} className="mt-0.5 shrink-0 text-amber-400" />
                      {plan.featured_job_limit} featured{" "}
                      {plan.featured_job_limit === 1 ? "listing" : "listings"}
                    </li>
                  )}

                  <li className="flex items-start gap-2 text-slate-600">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                    Listings run for {plan.job_duration_days} days
                  </li>

                  <li className="flex items-start gap-2 text-slate-600">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                    Company profile page
                  </li>

                  <li className="flex items-start gap-2 text-slate-600">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                    Views and apply-click reporting
                  </li>
                </ul>

                <Link
                  href={`/employer/billing?plan=${plan.slug}`}
                  className={`mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                    plan.is_popular
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600"
                  }`}
                >
                  {plan.is_free ? "Start free" : `Choose ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-center">
            <h2 className="font-bold text-slate-900">How applications work</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Candidates apply on your own site or by email — we send them
              straight to you rather than collecting CVs here. Every listing
              reports how many people saw it and how many clicked through.
            </p>
          </div>
        </div>
      </main>

      <DarkFooter />
    </>
  );
}
