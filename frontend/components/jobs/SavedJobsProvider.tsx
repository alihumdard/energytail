"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { seeker } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Knows which jobs the signed-in candidate has saved.
 *
 * A board renders many cards, and each one needs to know whether its job is
 * already saved. Asking per card would be twenty requests for one page, so
 * the ids are collected on mount and resolved in a single /check call — which
 * is exactly what that endpoint exists for.
 *
 * Guests get an inert context: nothing is fetched, and the button falls back
 * to prompting a sign-in.
 */

interface SavedJobsValue {
  /** Null until the first check resolves, so a button can avoid flickering. */
  saved: Set<number> | null;
  /** Registers a job id so the next check includes it. */
  track: (jobId: number) => void;
  setSaved: (jobId: number, isSaved: boolean) => void;
  signedIn: boolean;
}

const SavedJobsContext = createContext<SavedJobsValue | null>(null);

export function SavedJobsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  const [saved, setSavedSet] = useState<Set<number> | null>(null);

  /*
   * Ids collected during the render pass, held in a ref rather than state:
   * every card registering itself would otherwise be a state write per card,
   * and the effect below only needs the final list.
   */
  const pending = useRef<Set<number>>(new Set());
  const [tick, setTick] = useState(0);

  const track = useCallback((jobId: number) => {
    if (pending.current.has(jobId)) return;

    pending.current.add(jobId);
    // Nudges the effect once per newly-seen batch of cards.
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    // Nothing to resolve for a guest; `saved` is derived below rather than
    // cleared here, since writing state during an effect fights React.
    if (loading || user === null) return;

    const ids = [...pending.current];
    if (ids.length === 0) return;

    let cancelled = false;

    seeker
      .checkSaved(ids)
      .then(({ data }) => {
        if (!cancelled) setSavedSet(new Set(data));
      })
      // An empty set is the honest fallback: the buttons render as "not
      // saved", and pressing one still works.
      .catch(() => {
        if (!cancelled) setSavedSet(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [loading, user, tick]);

  const setSaved = useCallback((jobId: number, isSaved: boolean) => {
    setSavedSet((current) => {
      const next = new Set(current ?? []);

      if (isSaved) {
        next.add(jobId);
      } else {
        next.delete(jobId);
      }

      return next;
    });
  }, []);

  /*
   * A guest has no saved jobs, and signing out must not leave the previous
   * account's bookmarks on screen. Derived during render rather than cleared
   * from an effect.
   */
  const visible = user === null ? null : saved;

  const value = useMemo(
    () => ({ saved: visible, track, setSaved, signedIn: user !== null }),
    [visible, track, setSaved, user],
  );

  return (
    <SavedJobsContext.Provider value={value}>
      {children}
    </SavedJobsContext.Provider>
  );
}

/**
 * The saved-jobs context, or null outside a provider.
 *
 * Returning null rather than throwing lets a save button appear on a page
 * that has no provider — the job detail page, which renders one button and
 * checks for itself.
 */
export function useSavedJobs(): SavedJobsValue | null {
  return useContext(SavedJobsContext);
}
