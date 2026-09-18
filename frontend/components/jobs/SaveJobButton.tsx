"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Loader2 } from "lucide-react";
import { seeker } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useSavedJobs } from "./SavedJobsProvider";

/**
 * Saves or unsaves a job.
 *
 * Inside a SavedJobsProvider it reads its state from the board's single
 * /check call; on a page with only one job it asks for itself. Either way
 * the API is idempotent, so a double click cannot create a duplicate.
 *
 * Guests are sent to sign in rather than shown a button that fails: saving
 * needs an account, and a bookmark that silently does nothing is worse than
 * one that explains itself.
 */
export default function SaveJobButton({
  jobId,
  variant = "icon",
}: {
  jobId: number;
  /** "icon" for a job card, "full" for the detail page's action row. */
  variant?: "icon" | "full";
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const board = useSavedJobs();

  const [own, setOwn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  // Registers with the board so the next batched check includes this job.
  useEffect(() => {
    board?.track(jobId);
  }, [board, jobId]);

  /*
   * Standalone: no provider to batch with, so this button asks about itself.
   * Skipped entirely when a board is present.
   */
  useEffect(() => {
    if (board !== null || authLoading || user === null) return;

    let cancelled = false;

    seeker
      .checkSaved([jobId])
      .then(({ data }) => {
        if (!cancelled) setOwn(data.includes(jobId));
      })
      .catch(() => {
        if (!cancelled) setOwn(false);
      });

    return () => {
      cancelled = true;
    };
  }, [board, authLoading, user, jobId]);

  const isSaved = board ? (board.saved?.has(jobId) ?? false) : (own ?? false);
  const known = board ? board.saved !== null : own !== null;

  async function toggle() {
    if (user === null) {
      // Comes back to this page once they have signed in.
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );

      return;
    }

    const next = !isSaved;

    setBusy(true);

    // Flipped immediately: a bookmark that lags behind the click feels broken.
    if (board) {
      board.setSaved(jobId, next);
    } else {
      setOwn(next);
    }

    try {
      if (next) {
        await seeker.saveJob(jobId);
      } else {
        await seeker.unsaveJob(jobId);
      }
    } catch {
      // Put it back — the server is the truth, not the optimistic flip.
      if (board) {
        board.setSaved(jobId, !next);
      } else {
        setOwn(!next);
      }
    } finally {
      setBusy(false);
    }
  }

  const label = isSaved ? "Saved" : "Save";
  const title =
    user === null ? "Sign in to save this job" : `${label} this job`;

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={isSaved}
        title={title}
        className={`flex items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
          isSaved
            ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            : "border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bookmark size={16} className={isSaved ? "fill-current" : ""} />
        )}
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={isSaved}
      aria-label={title}
      title={title}
      className={`rounded-lg p-2 transition-colors disabled:opacity-60 ${
        isSaved
          ? "text-blue-600 hover:bg-blue-50"
          : "text-slate-300 hover:bg-slate-50 hover:text-slate-500"
      }`}
    >
      {busy ? (
        <Loader2 className="h-[18px] w-[18px] animate-spin" />
      ) : (
        <Bookmark
          size={18}
          /*
           * Filled only once the state is known, so a saved job does not
           * briefly render as unsaved while the check is in flight.
           */
          className={known && isSaved ? "fill-current" : ""}
        />
      )}
    </button>
  );
}
