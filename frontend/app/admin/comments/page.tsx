"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  Check,
  Clock,
  Flag,
  Loader2,
  MessageSquare,
  Search,
  Trash2,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { ApiError } from "@/lib/api/client";
import { adminComments } from "@/lib/api/endpoints";
import type { AdminComment, CommentStats } from "@/lib/api/types";

/**
 * The comment moderation queue.
 *
 * Pending comments lead the list — a held comment is someone waiting — and
 * reported ones can be pulled to the front, which is what a moderator opens
 * this screen to deal with.
 */

const TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "spam", label: "Spam" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  spam: "bg-red-50 text-red-700",
  rejected: "bg-slate-100 text-slate-600",
};

function when(value: string | null): string {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminCommentsPage() {
  const [rows, setRows] = useState<AdminComment[] | null>(null);
  const [stats, setStats] = useState<CommentStats | null>(null);
  const [status, setStatus] = useState("");
  const [reportedOnly, setReportedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<AdminComment | null>(null);

  const load = useCallback(async () => {
    const [list, counts] = await Promise.all([
      adminComments.list({
        status: status || undefined,
        reported: reportedOnly ? 1 : undefined,
        search: search || undefined,
        per_page: 50,
      }),
      adminComments.stats(),
    ]);

    setRows(list.data);
    setStats(counts.data);
  }, [status, reportedOnly, search]);

  useEffect(() => {
    let cancelled = false;

    /*
     * Wrapped in an async function rather than chaining .catch() directly:
     * a promise that rejects immediately runs its handler synchronously,
     * which sets state during the effect and trips React's cascading-render
     * guard. Awaiting first pushes the write to a later tick.
     */
    async function run() {
      try {
        await load();
      } catch {
        // An empty list is the honest fallback — a spinner that never
        // resolves would suggest the queue is still loading.
        if (!cancelled) setRows([]);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [load]);

  async function moderate(comment: AdminComment, next: string) {
    setBusy(comment.id);
    setError(null);

    try {
      await adminComments.setStatus(comment.id, next);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Could not update the comment.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function remove(comment: AdminComment) {
    setBusy(comment.id);
    setConfirming(null);

    try {
      await adminComments.remove(comment.id);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Could not remove the comment.",
      );
    } finally {
      setBusy(null);
    }
  }

  const cards: {
    label: string;
    value: number;
    icon: typeof MessageSquare;
    tone: string;
  }[] = [
    {
      label: "Total",
      value: stats?.total ?? 0,
      icon: MessageSquare,
      tone: "text-slate-400",
    },
    {
      label: "Awaiting review",
      value: stats?.pending ?? 0,
      icon: Clock,
      tone: "text-amber-500",
    },
    {
      label: "Reported",
      value: stats?.reported ?? 0,
      icon: Flag,
      tone: "text-red-500",
    },
    {
      label: "Spam",
      value: stats?.spam ?? 0,
      icon: Ban,
      tone: "text-slate-400",
    },
  ];

  return (
    <AdminShell active="comments">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Comments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approve, hide and remove what readers leave under your articles.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-100 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{card.label}</p>
              <card.icon className={card.tone} size={18} />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key || "all"}
                type="button"
                onClick={() => setStatus(tab.key)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                  status === tab.key
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setReportedOnly((on) => !on)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                reportedOnly
                  ? "bg-red-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Flag size={13} /> Reported
            </button>
          </div>

          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <label htmlFor="comment-search" className="sr-only">
              Search comments
            </label>
            <input
              id="comment-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Text, name or email…"
              className="w-64 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {rows === null ? (
          <p className="flex items-center gap-2 p-6 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading comments…
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Nothing here — no comments match this filter.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li key={row.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {row.author}
                  </span>

                  {row.is_member ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                      Member
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      Guest
                    </span>
                  )}

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      STATUS_STYLES[row.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {row.status}
                  </span>

                  {row.reports_count > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                      <AlertTriangle size={10} /> {row.reports_count} report
                      {row.reports_count === 1 ? "" : "s"}
                    </span>
                  )}

                  {row.is_reply && (
                    <span className="text-[10px] font-medium text-slate-400">
                      reply
                    </span>
                  )}
                </div>

                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                  {row.body}
                </p>

                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span>{when(row.created_at)}</span>
                  {/* Email and IP are what spam moderation actually needs. */}
                  {row.email && <span>{row.email}</span>}
                  {row.ip_address && <span>{row.ip_address}</span>}
                  {row.article && (
                    <Link
                      href={`/articles/${row.article.slug}`}
                      target="_blank"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {row.article.title}
                    </Link>
                  )}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {row.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => moderate(row, "approved")}
                      disabled={busy === row.id}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busy === row.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                      Approve
                    </button>
                  )}

                  {row.status !== "spam" && (
                    <button
                      type="button"
                      onClick={() => moderate(row, "spam")}
                      disabled={busy === row.id}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Ban size={13} /> Spam
                    </button>
                  )}

                  {row.status !== "rejected" && (
                    <button
                      type="button"
                      onClick={() => moderate(row, "rejected")}
                      disabled={busy === row.id}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Hide
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setConfirming(row)}
                    disabled={busy === row.id}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <h3 className="font-semibold text-slate-900">
              Delete this comment?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {/*
                Said plainly: a moderator deleting a parent needs to know the
                replies go with it.
              */}
              Any replies to it will be removed as well. This cannot be undone
              from here.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => remove(confirming)}
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
