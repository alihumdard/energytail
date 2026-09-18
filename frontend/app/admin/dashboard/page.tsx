"use client";

import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Eye,
  FileText,
  Loader2,
  MousePointerClick,
  Users,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { adminDashboard } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/useApiResource";
import RequireRole from "@/components/auth/RequireRole";

function timeAgo(value: string | null): string {
  if (!value) return "";

  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86_400)} d ago`;
}

const ACTION_TONE: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-600",
  rejected: "bg-red-50 text-red-600",
  suspended: "bg-red-50 text-red-600",
  deleted: "bg-red-50 text-red-600",
  created: "bg-blue-50 text-blue-600",
  updated: "bg-slate-100 text-slate-600",
};

export default function AdminDashboardPage() {
  const { data, loading, error } = useApiResource(
    () => adminDashboard.get(),
    [],
  );

  const d = data?.data;
  const totals = d?.totals;
  const moderation = d?.moderation;

  const cards = [
    {
      label: "Users",
      value: totals?.users,
      icon: Users,
      tone: "bg-blue-50 text-blue-600",
      href: "/admin/users",
      sub: d ? `${d.usersByRole.length} roles` : null,
    },
    {
      label: "Companies",
      value: totals?.companies,
      icon: Building2,
      tone: "bg-violet-50 text-violet-600",
      href: "/admin/companies",
      sub: moderation ? `${moderation.unverified_companies} unverified` : null,
    },
    {
      label: "Jobs",
      value: totals?.jobs,
      icon: Briefcase,
      tone: "bg-emerald-50 text-emerald-600",
      href: "/admin/jobs",
      sub: totals ? `${totals.published_jobs} published` : null,
    },
    {
      label: "Articles",
      value: totals?.articles,
      icon: FileText,
      tone: "bg-orange-50 text-orange-600",
      href: "/admin/articles",
      sub: totals ? `${totals.published_articles} published` : null,
    },
  ];

  /*
   * Views and apply clicks, never "applications".
   *
   * Candidates apply on the employer's own site through apply_url/apply_email
   * — there is no applications table to count. The mock this replaced showed
   * "8,592 Applications", a figure the platform could never produce.
   */
  const engagement = [
    { label: "Job Views", value: totals?.job_views, icon: Eye },
    {
      label: "Apply Clicks",
      value: totals?.apply_clicks,
      icon: MousePointerClick,
    },
    { label: "Article Views", value: totals?.article_views, icon: FileText },
  ];

  // Only what actually needs attention gets a row, so an empty queue reads as
  // "nothing to do" rather than a wall of zeroes.
  const queue = [
    {
      label: "Articles awaiting review",
      count: moderation?.articles_pending ?? 0,
      href: "/admin/articles",
    },
    {
      label: "Jobs awaiting review",
      count: moderation?.jobs_pending ?? 0,
      href: "/admin/jobs",
    },
    {
      label: "Companies awaiting approval",
      count: moderation?.companies_pending ?? 0,
      href: "/admin/companies",
    },
    {
      label: "Suspended users",
      count: moderation?.suspended_users ?? 0,
      href: "/admin/users",
    },
  ].filter((row) => row.count > 0);

  return (
    <RequireRole permission="users.view">
      <AdminShell active="dashboard">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Everything on the platform, counted live.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Could not load the dashboard. {error.detail}
          </div>
        )}

        {/* Totals */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-slate-500">{c.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {c.value === undefined ? (
                      <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                    ) : (
                      c.value.toLocaleString()
                    )}
                  </p>
                  {c.sub && (
                    <p className="mt-1 text-xs text-slate-400">{c.sub}</p>
                  )}
                </div>
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${c.tone}`}
                >
                  <c.icon size={20} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-6">
            {/* Engagement */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">Engagement</h2>
              <p className="mt-1 text-xs text-slate-400">
                Candidates apply on the employer&apos;s own site, so the board
                measures views and click-throughs rather than applications.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {engagement.map((e) => (
                  <div key={e.label} className="rounded-lg bg-slate-50 p-4">
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <e.icon size={13} /> {e.label}
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {e.value === undefined ? "—" : e.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Jobs by category */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">
                  Published Jobs by Category
                </h2>
                <Link
                  href="/admin/job-categories"
                  className="text-xs font-semibold text-blue-600"
                >
                  Manage
                </Link>
              </div>

              {!d ? (
                <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : d.jobsByCategory.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">
                  No published jobs yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {d.jobsByCategory.map((c) => (
                    <div
                      key={c.label}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="w-48 shrink-0 truncate text-slate-600">
                        {c.label}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${c.pct}%`,
                            backgroundColor: c.color,
                          }}
                        />
                      </span>
                      <span className="w-16 shrink-0 text-right text-xs text-slate-400">
                        {c.value} ({c.pct}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top countries */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 font-semibold text-slate-900">
                Where the Jobs Are
              </h2>

              {!d ? (
                <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : d.topCountries.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">
                  No published jobs yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {d.topCountries.map((c) => (
                    <div
                      key={c.code}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="w-40 shrink-0 truncate text-slate-600">
                        {c.flag} {c.label}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-full rounded-full bg-blue-500"
                          style={{ width: `${(c.value / c.max) * 100}%` }}
                        />
                      </span>
                      <span className="w-8 shrink-0 text-right text-xs text-slate-400">
                        {c.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="min-w-0 space-y-6">
            {/* Needs attention */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 font-semibold text-slate-900">
                Needs Attention
              </h2>

              {!d ? (
                <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : queue.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">
                  Nothing is waiting for review.
                </p>
              ) : (
                <div className="space-y-1">
                  {queue.map((row) => (
                    <Link
                      key={row.label}
                      href={row.href}
                      className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-slate-50"
                    >
                      <span className="text-sm text-slate-700">
                        {row.label}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                          {row.count}
                        </span>
                        <ArrowRight size={14} className="text-slate-300" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Users by role */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Users by Role</h2>
                <Link
                  href="/admin/users"
                  className="text-xs font-semibold text-blue-600"
                >
                  View all
                </Link>
              </div>

              {!d ? (
                <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <div className="space-y-2">
                  {d.usersByRole.map((r) => (
                    <div
                      key={r.role}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-600">{r.label}</span>
                      <span className="font-semibold text-slate-900">
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent activity */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">
                  Recent Activity
                </h2>
                <Link
                  href="/admin/audit-logs"
                  className="text-xs font-semibold text-blue-600"
                >
                  View all
                </Link>
              </div>

              {!d ? (
                <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : d.recentActivity.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">
                  Nothing logged yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {d.recentActivity.map((a) => (
                    <div key={a.id} className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          ACTION_TONE[a.action ?? ""] ??
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {a.action ?? "—"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-700">
                          {a.description}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {a.user ?? "System"} · {timeAgo(a.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading && !d && (
          <p className="mt-6 flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the dashboard…
          </p>
        )}
      </AdminShell>
    </RequireRole>
  );
}
