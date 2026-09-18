"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  MessageSquare,
  Search,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { ApiError } from "@/lib/api/client";
import { adminArticles } from "@/lib/api/endpoints";
import { useApiResource, useDebounced } from "@/lib/hooks/useApiResource";
import type { AdminArticle } from "@/lib/api/types";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700",
  pending_review: "bg-blue-50 text-blue-700",
  draft: "bg-slate-100 text-slate-600",
  scheduled: "bg-violet-50 text-violet-700",
  rejected: "bg-red-50 text-red-700",
};

const TABS = [
  { label: "All", status: "" },
  { label: "Pending Review", status: "pending_review" },
  { label: "Published", status: "published" },
  { label: "Drafts", status: "draft" },
  { label: "Rejected", status: "rejected" },
];

function humanise(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminArticlesPage() {
  const [tab, setTab] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminArticle | null>(null);
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState<AdminArticle | null>(null);

  const debouncedSearch = useDebounced(search);

  const {
    data: list,
    loading,
    refetch,
  } = useApiResource(
    () =>
      adminArticles.list({
        status: tab || undefined,
        search: debouncedSearch || undefined,
        page,
        per_page: 20,
      }),
    [tab, debouncedSearch, page],
  );

  const { data: statsResponse, refetch: refetchStats } = useApiResource(
    () => adminArticles.stats(),
    [],
  );

  const articles = list?.data ?? [];
  const meta = list?.meta;
  const stats = statsResponse?.data.stats;

  async function run(article: AdminArticle, work: () => Promise<unknown>) {
    setBusyId(article.id);
    setActionError(null);

    try {
      await work();
      refetch();
      refetchStats();
    } catch (err) {
      // ApiError.detail, not .message: a 422's top-level text is always
      // "The given data was invalid." and explains nothing.
      setActionError(
        err instanceof ApiError ? err.detail : "Could not update the article.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject() {
    if (!rejecting) return;

    const article = rejecting;
    const text = reason;

    setRejecting(null);
    setReason("");

    await run(article, () => adminArticles.reject(article.id, text));
  }

  async function confirmDelete() {
    if (!deleting) return;

    const article = deleting;
    setDeleting(null);

    await run(article, () => adminArticles.remove(article.id));
  }

  const cards = [
    {
      label: "Total Articles",
      value: stats?.total,
      icon: FileText,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Pending Review",
      value: stats?.pending_review,
      icon: Clock,
      tone: "bg-orange-50 text-orange-600",
    },
    {
      label: "Published",
      value: stats?.published,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total Views",
      value: stats?.views,
      icon: Eye,
      tone: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <AdminShell active="articles">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Articles</h1>
        <p className="mt-1 text-sm text-slate-500">
          Articles are reviewed before they go live. Approve, send back with a
          reason, or take a published piece off the feed.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
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
              </div>
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${c.tone}`}
              >
                <c.icon size={20} />
              </span>
            </div>
          </div>
        ))}
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
                {t.status === "pending_review" && stats?.pending_review ? (
                  <span className="ml-1.5 rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
                    {stats.pending_review}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Title, excerpt or author…"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        {loading && articles.length === 0 ? (
          <div className="flex items-center gap-2 p-10 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading articles…
          </div>
        ) : articles.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No articles match this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                  <th className="px-4 py-3 font-medium">Article</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => {
                  const busy = busyId === a.id;

                  return (
                    <tr
                      key={a.id}
                      className="border-b border-slate-50 last:border-0 align-top"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800">
                            {a.title}
                          </p>
                          {a.is_featured && (
                            <Star
                              size={13}
                              className="shrink-0 fill-amber-400 text-amber-400"
                            />
                          )}
                        </div>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                          {a.reading_minutes
                            ? `${a.reading_minutes} min read`
                            : null}
                          {a.comments_count > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare size={11} />
                              {a.comments_count}
                            </span>
                          )}
                        </p>
                        {/* The reason a piece came back, where a moderator
                                reviewing the queue will actually see it. */}
                        {a.status === "rejected" && a.review_notes && (
                          <p className="mt-1.5 rounded border border-red-100 bg-red-50 px-2 py-1 text-xs text-red-700">
                            {a.review_notes}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {a.author ? (
                          <>
                            <p className="text-slate-700">{a.author.name}</p>
                            <p className="text-xs text-slate-400">
                              {a.author.email}
                            </p>
                          </>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        {a.category?.name ?? "—"}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        {a.views_count.toLocaleString()}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            STATUS_STYLE[a.status] ??
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {humanise(a.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500">
                        {formatDate(a.published_at ?? a.created_at)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : (
                            <>
                              <button
                                type="button"
                                title={a.is_featured ? "Unfeature" : "Feature"}
                                onClick={() =>
                                  run(a, () =>
                                    adminArticles.toggleFeatured(a.id),
                                  )
                                }
                                className={`rounded p-1.5 hover:bg-slate-100 ${
                                  a.is_featured
                                    ? "text-amber-500"
                                    : "text-slate-300"
                                }`}
                              >
                                <Star size={16} />
                              </button>

                              {a.status !== "published" && (
                                <button
                                  type="button"
                                  title="Approve and publish"
                                  onClick={() =>
                                    run(a, () => adminArticles.approve(a.id))
                                  }
                                  className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}

                              {a.status === "published" ? (
                                <button
                                  type="button"
                                  title="Unpublish"
                                  onClick={() =>
                                    run(a, () => adminArticles.unpublish(a.id))
                                  }
                                  className="rounded p-1.5 text-orange-500 hover:bg-orange-50"
                                >
                                  <EyeOff size={16} />
                                </button>
                              ) : (
                                a.status !== "rejected" && (
                                  <button
                                    type="button"
                                    title="Send back to author"
                                    onClick={() => setRejecting(a)}
                                    className="rounded p-1.5 text-red-500 hover:bg-red-50"
                                  >
                                    <XCircle size={16} />
                                  </button>
                                )
                              )}

                              <Link
                                href={`/articles/${a.slug}`}
                                target="_blank"
                                title="View public page"
                                className="rounded p-1.5 text-slate-400 hover:bg-slate-100"
                              >
                                <Eye size={16} />
                              </Link>

                              <button
                                type="button"
                                title="Delete"
                                onClick={() => setDeleting(a)}
                                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4 text-sm">
            <p className="text-slate-500">
              Page {meta.current_page} of {meta.last_page} · {meta.total}{" "}
              articles
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

      {/* Reject dialog — the reason is stored on the article for the author. */}
      {rejecting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Send back to the author?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              &ldquo;{rejecting.title}&rdquo; goes back as rejected. The reason
              is saved on the article so the author can read it and fix the
              piece.
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="What needs to change before this can be published?"
              className="mt-4 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-400 focus:outline-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejecting(null);
                  setReason("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reason.trim() === ""}
                onClick={confirmReject}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
              >
                Send back
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Delete this article?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              &ldquo;{deleting.title}&rdquo; will be removed from the site.
              Sending it back to the author is usually the better choice — a
              deleted article cannot be corrected and resubmitted.
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
    </AdminShell>
  );
}
