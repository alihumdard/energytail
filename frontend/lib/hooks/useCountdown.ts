"use client";

import { useEffect, useState } from "react";

/**
 * Counts down to zero, one second at a time.
 *
 * Used by the rate-limit notices and the resend-email cooldown, so a blocked
 * user sees how long the wait is rather than a message telling them to try
 * again at some unstated point.
 *
 * Render stays pure — no clock reads, no refs. State holds both the duration
 * being counted and the seconds left, written together so a new duration can
 * never be paired with a leftover count from the previous wait.
 */
export function useCountdown(seconds: number | undefined): number {
  const total = seconds && seconds > 0 ? seconds : 0;

  const [state, setState] = useState({ total: 0, remaining: 0 });

  useEffect(() => {
    if (total === 0) return;

    const startedAt = Date.now();

    // No seeding call here: until the first tick lands, the return below
    // already reports the full duration for this total.
    const timer = setInterval(() => {
      // Measured against the start rather than decremented, so a backgrounded
      // tab — where timers are throttled — resumes with the right figure
      // instead of one frozen at the moment it lost focus.
      const left = Math.max(0, total - Math.floor((Date.now() - startedAt) / 1000));

      setState({ total, remaining: left });

      if (left === 0) clearInterval(timer);
    }, 1000);

    // Nothing to reset on the way out: state is keyed by total, so a stale
    // entry is ignored rather than needing to be cleared.
    return () => clearInterval(timer);
  }, [total]);

  /*
   * Until the effect runs, state still describes the previous wait. Reporting
   * the full duration in that gap avoids a frame showing a stale number — and
   * for the one render before a countdown starts, the full duration is right.
   */
  return state.total === total ? state.remaining : total;
}

/** Formats a second count as "45s" or "2m 05s". */
export function formatCountdown(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
}
