"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Flag, Loader2, MessageSquare, Reply, Send } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { comments as commentsApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { CommentThreadMeta, PublicComment } from "@/lib/api/types";

/**
 * The discussion under an article.
 *
 * Client-rendered on purpose: the thread changes as people post, and the
 * article page itself is cached for crawlers. What matters for SEO is the
 * article body, which is already server-rendered above this.
 */

const REPORT_REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "abuse", label: "Abusive or offensive" },
  { value: "off_topic", label: "Off topic" },
  { value: "other", label: "Something else" },
];

function when(value: string | null): string {
  if (!value) return "";

  const posted = new Date(value);
  const minutes = Math.round((Date.now() - posted.getTime()) / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  if (minutes < 10080) return `${Math.round(minutes / 1440)}d ago`;

  return posted.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Comments({ slug }: { slug: string }) {
  const { user, loading: authLoading } = useAuth();

  const [thread, setThread] = useState<PublicComment[] | null>(null);
  const [meta, setMeta] = useState<CommentThreadMeta | null>(null);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [reporting, setReporting] = useState<number | null>(null);

  async function load() {
    const { data, meta } = await commentsApi.list(slug);
    setThread(data);
    setMeta(meta);
  }

  useEffect(() => {
    let cancelled = false;

    commentsApi
      .list(slug)
      .then(({ data, meta }) => {
        if (cancelled) return;
        setThread(data);
        setMeta(meta);
      })
      // An empty thread is the honest fallback — a spinner that never stops
      // would suggest the comments are still coming.
      .catch(() => {
        if (!cancelled) setThread([]);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const canPost = meta?.enabled ?? false;
  const guestsAllowed = meta?.guests_allowed ?? false;
  const total = thread?.reduce((sum, c) => sum + 1 + c.replies.length, 0) ?? 0;

  return (
    <section className="mt-10 border-t border-slate-100 pt-8">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <MessageSquare size={18} className="text-slate-400" />
        {total === 0 ? "Comments" : `${total} comment${total === 1 ? "" : "s"}`}
      </h2>

      {!canPost && meta !== null && (
        <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Comments are closed on this article.
        </p>
      )}

      {/*
        The form sits above the thread: on an article with a long discussion,
        putting it at the bottom means scrolling past everything to reply.
      */}
      {canPost && !authLoading && (
        <CommentForm
          slug={slug}
          user={user}
          guestsAllowed={guestsAllowed}
          moderated={meta?.moderated ?? false}
          onPosted={load}
        />
      )}

      {thread === null ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading the discussion…
        </p>
      ) : thread.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          No comments yet{canPost ? " — be the first to say something." : "."}
        </p>
      ) : (
        <ul className="mt-6 space-y-6">
          {thread.map((comment) => (
            <li key={comment.id}>
              <CommentRow
                comment={comment}
                canReply={canPost}
                onReply={() =>
                  setReplyTo(replyTo === comment.id ? null : comment.id)
                }
                onReport={() => setReporting(comment.id)}
              />

              {comment.replies.length > 0 && (
                <ul className="mt-4 space-y-4 border-l-2 border-slate-100 pl-4 sm:pl-6">
                  {comment.replies.map((reply) => (
                    <li key={reply.id}>
                      <CommentRow
                        comment={reply}
                        canReply={canPost}
                        // Replying to a reply still attaches to the top-level
                        // comment, which is what the API does too.
                        onReply={() =>
                          setReplyTo(replyTo === comment.id ? null : comment.id)
                        }
                        onReport={() => setReporting(reply.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}

              {replyTo === comment.id && canPost && (
                <div className="mt-4 border-l-2 border-blue-100 pl-4 sm:pl-6">
                  <CommentForm
                    slug={slug}
                    user={user}
                    guestsAllowed={guestsAllowed}
                    moderated={meta?.moderated ?? false}
                    parentId={comment.id}
                    compact
                    onPosted={async () => {
                      setReplyTo(null);
                      await load();
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {reporting !== null && (
        <ReportDialog id={reporting} onClose={() => setReporting(null)} />
      )}
    </section>
  );
}

function CommentRow({
  comment,
  canReply,
  onReply,
  onReport,
}: {
  comment: PublicComment;
  canReply: boolean;
  onReply: () => void;
  onReport: () => void;
}) {
  return (
    <article className="flex gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
        {initials(comment.author)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-sm">
          <span className="font-semibold text-slate-900">{comment.author}</span>
          {/*
            Registered readers are badged so a guest cannot pass themselves
            off as one simply by typing the same name.
          */}
          {comment.is_member && (
            <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
              Member
            </span>
          )}
          <span className="text-xs text-slate-400">
            {when(comment.created_at)}
          </span>
        </p>

        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {comment.body}
        </p>

        <div className="mt-1.5 flex items-center gap-4">
          {canReply && (
            <button
              type="button"
              onClick={onReply}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-blue-600"
            >
              <Reply size={12} /> Reply
            </button>
          )}
          <button
            type="button"
            onClick={onReport}
            className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600"
          >
            <Flag size={12} /> Report
          </button>
        </div>
      </div>
    </article>
  );
}

function CommentForm({
  slug,
  user,
  guestsAllowed,
  moderated,
  parentId = null,
  compact = false,
  onPosted,
}: {
  slug: string;
  user: { full_name: string } | null;
  guestsAllowed: boolean;
  moderated: boolean;
  parentId?: number | null;
  compact?: boolean;
  onPosted: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Signing in is required unless the administrator has opened comments to
  // guests, so the form is replaced by a prompt rather than failing on submit.
  if (user === null && !guestsAllowed) {
    return (
      <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:underline"
        >
          Sign in
        </Link>{" "}
        to join the discussion.
      </p>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const body = String(form.get("body") ?? "").trim();

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const { message } = await commentsApi.post(slug, {
        body,
        parent_id: parentId,
        ...(user === null
          ? {
              guest_name: String(form.get("guest_name") ?? ""),
              guest_email: String(form.get("guest_email") ?? ""),
            }
          : {}),
      });

      (event.target as HTMLFormElement).reset();

      // A held comment does not appear in the thread, so the confirmation is
      // the only thing telling the reader it worked.
      if (moderated || user === null) {
        setNotice(message);
      } else {
        await onPosted();
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Could not post your comment.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (notice) {
    return (
      <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {notice}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? "mt-3" : "mt-4"} noValidate>
      {user === null && (
        <div className="mb-2 grid gap-2 sm:grid-cols-2">
          <input
            name="guest_name"
            required
            placeholder="Your name"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <input
            name="guest_email"
            type="email"
            required
            placeholder="Your email (not published)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      )}

      <label htmlFor={`comment-${parentId ?? "root"}`} className="sr-only">
        {parentId ? "Write a reply" : "Write a comment"}
      </label>
      <textarea
        id={`comment-${parentId ?? "root"}`}
        name="body"
        required
        rows={compact ? 2 : 3}
        placeholder={parentId ? "Write a reply…" : "Add to the discussion…"}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
      />

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send size={14} />
          )}
          {parentId ? "Reply" : "Post comment"}
        </button>

        {moderated && (
          <span className="text-xs text-slate-400">
            Comments are reviewed before they appear.
          </span>
        )}
      </div>
    </form>
  );
}

function ReportDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    setBusy(true);

    try {
      const { message } = await commentsApi.report(
        id,
        String(form.get("reason") ?? "other"),
        String(form.get("details") ?? "") || undefined,
      );
      setDone(message);
    } catch {
      setDone("Could not send the report. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5">
        <h3 id="report-title" className="font-semibold text-slate-900">
          Report this comment
        </h3>

        {done ? (
          <>
            <p className="mt-2 text-sm text-slate-600">{done}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Close
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Reason</span>
              <select
                name="reason"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
              >
                {REPORT_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Anything else?{" "}
                <span className="text-slate-400">(optional)</span>
              </span>
              <textarea
                name="details"
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={busy}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Send report
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
