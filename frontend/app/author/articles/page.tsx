"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Eye,
  Loader2,
  MessageCircle,
  Pencil,
  PenLine,
  Search,
  Trash2,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { authorArticles } from "@/lib/api/endpoints";
import { useApiResource, useDebounced } from "@/lib/hooks/useApiResource";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { AuthorArticle } from "@/lib/api/types";
import RoleShell from "@/components/RoleShell";

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  published: { label: "Published", className: "bg-emerald-50 text-emerald-700" },
  pending_review: { label: "In Review", className: "bg-blue-50 text-blue-700" },
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  rejected: { label: "Needs Changes", className: "bg-red-50 text-red-700" },
  scheduled: { label: "Scheduled", className: "bg-violet-50 text-violet-700" },
};

const TABS = [
  { label: "All", status: "" },
  { label: "Needs Changes", status: "rejected" },
  { label: "In Review", status: "pending_review" },
  { label: "Drafts", status: "draft" },
  { label: "Published", status: "published" },
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyArticlesPage() {
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AuthorArticle | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: list, loading, refetch } = useApiResource(
    () =>
      authorArticles.list({
        status: tab || undefined,
        search: debouncedSearch || undefined,
        page,
        per_page: 20,
      }),
    [tab, debouncedSearch, page],
  );

  const articles = list?.data ?? [];
  const meta = list?.meta;

  async function confirmDelete() {
    if (!deleting) return;

    const article = deleting;
    setDeleting(null);
    setBusyId(article.id);
    setActionError(null);

    try {
      await authorArticles.remove(article.id);
      refetch();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.detail : "Could not delete the article.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!authLoading && user && !user.roles.includes("author") && !user.roles.includes("administrator")) {
    return (
      <RoleShell role="author">
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-slate-900">Authors only</h1>
          <p className="mt-2 text-slate-500">This page needs an author account.</p>
        </main>
      </RoleShell>
    );
  }

  return (
    <RoleShell role="author">

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Articles</h1>
            <p className="mt-1 text-sm text-slate-500">
              Drafts, pieces in review, and everything you have published.
            </p>
          </div>
          <Link
            href="/author/articles/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <PenLine size={16} /> Write Article
          </Link>
        </div>

        {actionError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
            <div className="flex flex-wrap gap-1">
              {TABS.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setTab(t.status);
                    setPage(1);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    tab === t.status
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative ml-auto w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search your articles…"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          {loading && articles.length === 0 ? (
            <div className="flex items-center gap-2 p-10 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your articles…
            </div>
          ) : articles.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-500">
                {tab || search ? "Nothing matches this filter." : "You have not written anything yet."}
              </p>
              {!tab && !search && (
                <Link
                  href="/author/articles/new"
                  className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Write your first article
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {articles.map((a) => {
                const style = STATUS_STYLE[a.status] ?? {
                  label: a.status,
                  className: "bg-slate-100 text-slate-600",
                };
                const busy = busyId === a.id;

                return (
                  <li key={a.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-slate-900">{a.title}</h2>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}
                          >
                            {style.label}
                          </span>
                        </div>

                        <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {a.category && <span>{a.category.name}</span>}
                          <span>{formatDate(a.published_at ?? a.created_at)}</span>
                          {a.reading_minutes && <span>{a.reading_minutes} min read</span>}
                          <span className="inline-flex items-center gap-1">
                            <Eye size={11} /> {a.views_count.toLocaleString()}
                          </span>
                          {a.comments_count > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle size={11} /> {a.comments_count}
                            </span>
                          )}
                        </p>

                        {/* The editor's note, so the author knows what to fix. */}
                        {a.status === "rejected" && a.review_notes && (
                          <p className="mt-2 flex items-start gap-1.5 rounded border border-red-100 bg-red-50 px-2.5 py-2 text-xs text-red-700">
                            <AlertCircle size={13} className="mt-0.5 shrink-0" />
                            {a.review_notes}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : (
                          <>
                            {a.status === "published" ? (
                              <Link
                                href={`/articles/${a.slug}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                <Eye size={13} /> View
                              </Link>
                            ) : (
                              <>
                                <Link
                                  href={`/author/articles/${a.id}/edit`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                                >
                                  <Pencil size={13} /> Edit
                                </Link>
                                <button
                                  type="button"
                                  title="Delete"
                                  onClick={() => setDeleting(a)}
                                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 p-4 text-sm">
              <p className="text-slate-500">
                Page {meta.current_page} of {meta.last_page} · {meta.total} articles
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

      {deleting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Delete this article?</h2>
            <p className="mt-1 text-sm text-slate-500">
              &ldquo;{deleting.title}&rdquo; will be removed. This cannot be undone
              from here.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleShell>
  );
}
