"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleShell from "@/components/RoleShell";
import {
  Home,
  Bookmark,
  Bell,
  Search,
  Briefcase,
  MousePointerClick,
  Loader2,
  ArrowRight,
  MapPin,
  AlertCircle,
  UserRound,
} from "lucide-react";
import { seeker } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { SavedJob, SeekerDashboard } from "@/lib/api/types";
import RequireRole from "@/components/auth/RequireRole";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SeekerDashboardPage() {
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState<SeekerDashboard | null>(null);
  const [saved, setSaved] = useState<SavedJob[] | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    Promise.all([seeker.dashboard(), seeker.savedJobs({ per_page: 5 })])
      .then(([d, list]) => {
        if (cancelled) return;
        setData(d.data);
        setSaved(list.data);
      })
      .catch(() => {
        if (!cancelled) setSaved([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const stats = data?.stats;

  /*
   * What a candidate can actually be shown.
   *
   * The original design had Applied / Shortlisted / Rejected. None of those
   * can ever be real: applications leave the platform through the employer's
   * own apply_url or apply_email, so Energy Tail sees the click that sent the
   * candidate away and nothing after it. "Applications started" is that click,
   * named honestly.
   */
  const cards = [
    {
      label: "Saved Jobs",
      value: stats?.saved_jobs,
      icon: Bookmark,
      iconBg: "bg-blue-50 text-blue-600",
      sub: stats ? `${stats.saved_open} still open` : null,
    },
    {
      label: "Applications Started",
      value: stats?.applications_started,
      icon: MousePointerClick,
      iconBg: "bg-emerald-50 text-emerald-600",
      sub: stats ? `${stats.applications_this_month} this month` : null,
    },
    {
      label: "Job Alerts",
      value: stats?.alerts,
      icon: Bell,
      iconBg: "bg-violet-50 text-violet-600",
      sub: stats ? `${stats.active_alerts} active` : null,
    },
    {
      label: "Profile",
      value: data?.profile.completion,
      icon: UserRound,
      iconBg: "bg-orange-50 text-orange-600",
      suffix: "%",
      sub: data?.profile.missing.length
        ? `Add ${data.profile.missing.join(", ").toLowerCase()}`
        : "Complete",
    },
  ];

  const closedCount = stats?.saved_closed ?? 0;

  return (
    <RequireRole roles={["job_seeker", "administrator"]}>
      <RoleShell role="seeker">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back{user?.full_name ? `, ${user.full_name}` : ""}! 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Your saved jobs and alerts, in one place.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shrink-0"
          >
            <Search size={16} /> Find Jobs
          </Link>
        </div>

        {/* A saved job that has closed is the one thing here that goes stale. */}
        {closedCount > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle size={17} className="shrink-0 text-amber-600" />
            <p className="flex-1 text-sm text-amber-900">
              {closedCount === 1
                ? "One of your saved jobs has closed."
                : `${closedCount} of your saved jobs have closed.`}
            </p>
            <Link
              href="/saved-jobs"
              className="text-sm font-semibold text-amber-800 hover:text-amber-900"
            >
              Review them
            </Link>
          </div>
        )}

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
                      `${c.value.toLocaleString()}${c.suffix ?? ""}`
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

        <div className="grid xl:grid-cols-[1fr_340px] gap-6">
          {/* Saved jobs */}
          <div className="min-w-0 bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Your Saved Jobs</h2>
              <Link
                href="/saved-jobs"
                className="text-xs font-semibold text-blue-600 flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {saved === null ? (
              <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : saved.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-slate-500">
                  You have not saved any jobs yet.
                </p>
                <Link
                  href="/jobs"
                  className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Browse the board
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {saved.map((s) =>
                  s.job === null ? null : (
                    <li key={s.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/jobs/${s.job.slug}`}
                            className="font-medium text-slate-800 hover:text-blue-600"
                          >
                            {s.job.title}
                          </Link>
                          <p className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            {s.job.company && <span>{s.job.company.name}</span>}
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={11} />
                              {s.job.is_remote
                                ? "Remote"
                                : (s.job.location_label ?? "—")}
                            </span>
                            <span>Saved {formatDate(s.saved_at)}</span>
                          </p>
                        </div>

                        {!s.job.is_open && (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                            Closed
                          </span>
                        )}
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>

          {/* Right column */}
          <div className="min-w-0 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900">Job Alerts</h2>
                <Link
                  href="/job-alerts"
                  className="text-xs font-semibold text-blue-600"
                >
                  Manage
                </Link>
              </div>

              {!stats ? (
                <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : stats.alerts === 0 ? (
                <>
                  <p className="text-sm text-slate-500">
                    No alerts yet. Save a search and we will email you when
                    matching jobs are posted.
                  </p>
                  <Link
                    href="/job-alerts"
                    className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Create an alert
                  </Link>
                </>
              ) : (
                <p className="text-sm text-slate-600">
                  {stats.active_alerts} of {stats.alerts}{" "}
                  {stats.alerts === 1 ? "alert is" : "alerts are"} running.
                </p>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-900 mb-1">
                How applying works
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Energy Tail sends you to the employer&apos;s own site or inbox
                to apply — we do not handle applications here, so we cannot
                track their progress. Save the jobs you apply for to keep your
                own list.
              </p>
              <Link
                href="/jobs"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
              >
                Find your next role <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </RoleShell>
    </RequireRole>
  );
}
