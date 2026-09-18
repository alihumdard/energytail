"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell, { NavSection } from "@/components/DashboardShell";
import {
  Home,
  PlusCircle,
  Briefcase,
  FileText,
  Users,
  Building2,
  CreditCard,
  Plus,
  Eye,
  MousePointerClick,
  MapPin,
  ArrowRight,
  Loader2,
  Pencil,
} from "lucide-react";
import { employerJobs } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { EmployerJob, EmployerJobStats } from "@/lib/api/types";
import RequireRole from "@/components/auth/RequireRole";

const sections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      {
        label: "Dashboard",
        icon: Home,
        href: "/employer-dashboard",
        permission: "dashboard.view",
        active: true,
      },
      {
        label: "Post a Job",
        icon: PlusCircle,
        href: "/employer/jobs/new",
        permission: "jobs.add",
      },
      {
        label: "Jobs Management",
        icon: Briefcase,
        href: "/employer/jobs",
        permission: "jobs.view",
      },
      { label: "Browse Jobs", icon: FileText, href: "/jobs" },
    ],
  },
  {
    title: "COMPANY",
    items: [
      {
        label: "Company Profile",
        icon: Building2,
        href: "/employer/company-profile",
        permission: "companies.view",
      },
      {
        label: "Billing",
        icon: CreditCard,
        href: "/employer/billing",
        permission: "companies.edit",
      },
    ],
  },
];

const quickActions = [
  {
    icon: PlusCircle,
    title: "Post a New Job",
    body: "Reach the right candidates",
    href: "/employer/jobs/new",
    permission: "jobs.add",
  },
  {
    icon: Briefcase,
    title: "Manage Jobs",
    body: "Edit, pause or close jobs",
    href: "/employer/jobs",
    permission: "jobs.view",
  },
  {
    icon: Building2,
    title: "Company Profile",
    body: "Keep your details current",
    href: "/employer/company-profile",
    permission: "companies.view",
  },
  {
    icon: Users,
    title: "Browse the Board",
    body: "See how your listings appear",
    href: "/jobs",
  },
];

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  published: {
    label: "Published",
    className: "bg-emerald-50 text-emerald-600",
  },
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  pending_review: {
    label: "Pending Review",
    className: "bg-blue-50 text-blue-600",
  },
  expired: { label: "Expired", className: "bg-rose-50 text-rose-600" },
  closed: { label: "Closed", className: "bg-amber-50 text-amber-600" },
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function EmployerDashboardPage() {
  const { user, loading: authLoading, can } = useAuth();

  const [stats, setStats] = useState<EmployerJobStats | null>(null);
  const [jobs, setJobs] = useState<EmployerJob[] | null>(null);

  useEffect(() => {
    // Wait for the session, or both requests 401 and the page shows zeroes
    // to someone who has jobs.
    if (authLoading || !user) return;

    let cancelled = false;

    Promise.all([employerJobs.stats(), employerJobs.list({ per_page: 5 })])
      .then(([s, list]) => {
        if (cancelled) return;
        setStats(s.data);
        setJobs(list.data);
      })
      .catch(() => {
        if (cancelled) return;
        // Leave the cards in their loading state rather than inventing zeroes.
        setJobs([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  /*
   * What an employer actually gets.
   *
   * There is no applications table: candidates apply on the employer's own
   * site via apply_url/apply_email, and the platform only records the click
   * that sent them there. The mock cards promised "248 Applications" and
   * "36 Shortlisted", neither of which can ever be counted from here — so
   * these four report what is genuinely measured.
   */
  const cards = [
    {
      label: "Published Jobs",
      value: stats?.published,
      icon: Briefcase,
      iconBg: "bg-blue-50 text-blue-600",
      sub: stats ? `${stats.total} total` : null,
    },
    {
      label: "Job Views",
      value: stats?.views,
      icon: Eye,
      iconBg: "bg-orange-50 text-orange-600",
      sub: "All time",
    },
    {
      label: "Apply Clicks",
      value: stats?.apply_clicks,
      icon: MousePointerClick,
      iconBg: "bg-emerald-50 text-emerald-600",
      sub: "Sent to your site",
    },
    {
      label: "Drafts & Pending",
      value: stats === null ? undefined : stats.draft + stats.pending_review,
      icon: FileText,
      iconBg: "bg-violet-50 text-violet-600",
      sub: "Not yet live",
    },
  ];

  // Click-through rate is the one derived figure worth showing: views alone
  // say nothing about whether a listing actually persuades anyone.
  const ctr =
    stats && stats.views > 0
      ? ((stats.apply_clicks / stats.views) * 100).toFixed(1)
      : null;

  return (
    <RequireRole roles={["employer", "administrator"]}>
      <DashboardShell
        sections={sections}
        searchPlaceholder="Search jobs, candidates, companies..."
        searchTypeLabel="Jobs"
        notifCount={0}
        planTitle="Upgrade Your Plan"
        planBody="Get more visibility and better candidates by upgrading your subscription."
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Welcome back{user?.full_name ? `, ${user.full_name}` : ""}! 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Here&apos;s what&apos;s happening with your company today.
            </p>
          </div>
          <Link
            href="/employer/jobs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shrink-0"
          >
            <Plus size={16} /> Post a New Job
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {cards.map((c) => (
            <div
              key={c.label}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-sm text-slate-500">{c.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {c.value === undefined ? (
                      <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                    ) : (
                      c.value.toLocaleString()
                    )}
                  </p>
                </div>
                <span
                  className={`w-11 h-11 rounded-lg grid place-items-center shrink-0 ${c.iconBg}`}
                >
                  <c.icon size={20} />
                </span>
              </div>
              {c.sub && (
                <p className="text-xs font-medium text-slate-400">{c.sub}</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid xl:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6 min-w-0">
            {/* Listing performance */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-1">
                Listing Performance
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Candidates apply on your own site, so we track how many saw each
                listing and how many clicked through.
              </p>

              {stats === null ? (
                <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Views</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      {stats.views.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Apply clicks</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      {stats.apply_clicks.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Click-through rate</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      {ctr === null ? "—" : `${ctr}%`}
                    </p>
                  </div>
                </div>
              )}

              {stats !== null && (
                <div className="mt-5 space-y-2">
                  {(
                    [
                      ["Published", stats.published, "bg-emerald-500"],
                      ["Draft", stats.draft, "bg-slate-400"],
                      ["Pending review", stats.pending_review, "bg-blue-500"],
                      ["Expired", stats.expired, "bg-rose-500"],
                      ["Closed", stats.closed, "bg-amber-400"],
                    ] as [string, number, string][]
                  )
                    .filter(([, count]) => count > 0)
                    .map(([label, count, colour]) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 text-xs"
                      >
                        <span className="flex items-center gap-2 text-slate-600 w-32 shrink-0">
                          <span className={`w-2 h-2 rounded-full ${colour}`} />
                          {label}
                        </span>
                        <span className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <span
                            className={`block h-full ${colour}`}
                            style={{
                              width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`,
                            }}
                          />
                        </span>
                        <span className="text-slate-400 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Recent jobs */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">
                  Your Recent Jobs
                </h3>
                <Link
                  href="/employer/jobs"
                  className="text-xs font-semibold text-blue-600 flex items-center gap-1"
                >
                  View All Jobs <ArrowRight size={12} />
                </Link>
              </div>

              {jobs === null ? (
                <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading your
                  jobs…
                </div>
              ) : jobs.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-slate-500">
                    You have not posted a job yet.
                  </p>
                  <Link
                    href="/employer/jobs/new"
                    className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Post your first job
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                        <th className="pb-3 font-medium">Job Title</th>
                        <th className="pb-3 font-medium">Views</th>
                        <th className="pb-3 font-medium">Clicks</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Posted On</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((j) => {
                        const style = STATUS_STYLES[j.status] ?? {
                          label: j.status,
                          className: "bg-slate-100 text-slate-600",
                        };

                        return (
                          <tr
                            key={j.id}
                            className="border-b border-slate-50 last:border-0"
                          >
                            <td className="py-3.5">
                              <p className="font-medium text-slate-800">
                                {j.title}
                              </p>
                              {j.location_label && (
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                  <MapPin size={11} /> {j.location_label}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 text-slate-600">
                              {j.views_count.toLocaleString()}
                            </td>
                            <td className="py-3.5 text-slate-600">
                              {j.apply_clicks_count.toLocaleString()}
                            </td>
                            <td className="py-3.5">
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.className}`}
                              >
                                {style.label}
                              </span>
                            </td>
                            <td className="py-3.5 text-slate-500">
                              {formatDate(j.published_at ?? j.created_at)}
                            </td>
                            <td className="py-3.5 text-right">
                              <Link
                                href={`/employer/jobs/${j.id}/edit`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                              >
                                <Pencil size={13} /> Edit
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6 min-w-0">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-1">
                {quickActions
                  .filter((a) => !a.permission || can(a.permission))
                  .map((a) => (
                    <Link
                      key={a.title}
                      href={a.href}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 grid place-items-center shrink-0">
                        <a.icon size={18} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                          {a.title}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {a.body}
                        </span>
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-slate-300 shrink-0"
                      />
                    </Link>
                  ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-1">
                How applications work
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Energy Tail sends candidates to your own site or inbox — we do
                not collect CVs here. Each listing records how many people
                viewed it and how many clicked through to apply, which is what
                the numbers above report.
              </p>
              <Link
                href="/employer/jobs"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
              >
                See every listing <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </DashboardShell>
    </RequireRole>
  );
}
