"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleShell from "@/components/RoleShell";
import {
  Home,
  FileText,
  PenLine,
  FileEdit,
  Eye,
  MessageCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { authorArticles } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { AuthorArticle, AuthorArticleStats } from "@/lib/api/types";
import RequireRole from "@/components/auth/RequireRole";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  published: {
    label: "Published",
    className: "bg-emerald-50 text-emerald-600",
  },
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  pending_review: { label: "In Review", className: "bg-blue-50 text-blue-600" },
  rejected: { label: "Needs Changes", className: "bg-red-50 text-red-600" },
  scheduled: { label: "Scheduled", className: "bg-violet-50 text-violet-600" },
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AuthorDashboardPage() {
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<AuthorArticleStats | null>(null);
  const [articles, setArticles] = useState<AuthorArticle[] | null>(null);

  useEffect(() => {
    // Wait for the session, or both requests 401 and the page reports zeroes
    // to an author who has written plenty.
    if (authLoading || !user) return;

    let cancelled = false;

    Promise.all([authorArticles.stats(), authorArticles.list({ per_page: 6 })])
      .then(([s, list]) => {
        if (cancelled) return;
        setStats(s.data);
        setArticles(list.data);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  /*
   * What an author can actually be told.
   *
   * The mock also promised Likes and Bookmarks — neither table exists, so
   * there is nothing to count. Views and comments are real columns on the
   * article, and the review queue is the thing an author most needs to see.
   */
  const cards = [
    {
      label: "Published",
      value: stats?.published,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600",
      sub: stats ? `${stats.total} written` : null,
    },
    {
      label: "Total Views",
      value: stats?.views,
      icon: Eye,
      iconBg: "bg-blue-50 text-blue-600",
      sub: "All time",
    },
    {
      label: "In Review",
      value: stats?.pending_review,
      icon: Clock,
      iconBg: "bg-orange-50 text-orange-600",
      sub: "Waiting on an editor",
    },
    {
      label: "Comments",
      value: stats?.comments,
      icon: MessageCircle,
      iconBg: "bg-violet-50 text-violet-600",
      sub: "Across your articles",
    },
  ];

  const needsChanges = (articles ?? []).filter((a) => a.status === "rejected");

  return (
    <RequireRole roles={["author", "administrator"]}>
      <RoleShell role="author">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back{user?.full_name ? `, ${user.full_name}` : ""}! ✍️
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Articles are reviewed by an editor before they go live.
            </p>
          </div>
          <Link
            href="/author/articles/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shrink-0"
          >
            <PenLine size={16} /> Write Article
          </Link>
        </div>

        {/* Anything sent back is the first thing an author should see. */}
        {needsChanges.length > 0 && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-red-800">
              <AlertCircle size={17} />
              {needsChanges.length === 1
                ? "An article needs changes"
                : `${needsChanges.length} articles need changes`}
            </h2>
            <div className="mt-3 space-y-3">
              {needsChanges.map((a) => (
                <div key={a.id} className="rounded-lg bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-slate-800">{a.title}</p>
                    <Link
                      href={`/author/articles/${a.id}/edit`}
                      className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Fix it
                    </Link>
                  </div>
                  {a.review_notes && (
                    <p className="mt-1.5 text-sm text-slate-600">
                      {a.review_notes}
                    </p>
                  )}
                  {a.reviewer && (
                    <p className="mt-1 text-xs text-slate-400">
                      Reviewed by {a.reviewer.name} ·{" "}
                      {formatDate(a.reviewed_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>
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

        <div className="grid xl:grid-cols-[1fr_340px] gap-6">
          {/* Recent articles */}
          <div className="min-w-0 bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Your Articles</h2>
              <Link
                href="/author/articles"
                className="text-xs font-semibold text-blue-600 flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {articles === null ? (
              <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your
                articles…
              </div>
            ) : articles.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-slate-500">
                  You have not written anything yet.
                </p>
                <Link
                  href="/author/articles/new"
                  className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Write your first article
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                      <th className="pb-3 font-medium">Title</th>
                      <th className="pb-3 font-medium">Views</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((a) => {
                      const style = STATUS_STYLES[a.status] ?? {
                        label: a.status,
                        className: "bg-slate-100 text-slate-600",
                      };

                      return (
                        <tr
                          key={a.id}
                          className="border-b border-slate-50 last:border-0"
                        >
                          <td className="py-3.5">
                            <p className="font-medium text-slate-800">
                              {a.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {a.category?.name}
                              {a.reading_minutes
                                ? ` · ${a.reading_minutes} min read`
                                : ""}
                            </p>
                          </td>
                          <td className="py-3.5 text-slate-600">
                            {a.views_count.toLocaleString()}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.className}`}
                            >
                              {style.label}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500">
                            {formatDate(a.published_at ?? a.created_at)}
                          </td>
                          <td className="py-3.5 text-right">
                            {/* A published article is out of the author's hands
                              — editing after approval would defeat the review. */}
                            {a.status === "published" ? (
                              <Link
                                href={`/articles/${a.slug}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600"
                              >
                                <Eye size={13} /> View
                              </Link>
                            ) : (
                              <Link
                                href={`/author/articles/${a.id}/edit`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                              >
                                <Pencil size={13} /> Edit
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="min-w-0 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Your Work</h2>

              {stats === null ? (
                <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <div className="space-y-2">
                  {(
                    [
                      ["Published", stats.published, "bg-emerald-500"],
                      ["In review", stats.pending_review, "bg-blue-500"],
                      ["Drafts", stats.draft, "bg-slate-400"],
                      ["Needs changes", stats.rejected, "bg-red-500"],
                    ] as [string, number, string][]
                  )
                    .filter(([, count]) => count > 0)
                    .map(([label, count, colour]) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 text-sm"
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
                        <span className="text-slate-400 w-6 text-right">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-900 mb-1">
                How publishing works
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Save a draft while you work on it, then submit it for review. An
                editor reads it and either publishes it or sends it back with a
                note explaining what to change. Once a piece is live it can only
                be changed by an editor.
              </p>
              <Link
                href="/author/articles/new"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
              >
                Start writing <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </RoleShell>
    </RequireRole>
  );
}
