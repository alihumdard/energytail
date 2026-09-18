"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, MailWarning, RefreshCw, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { auth as authApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatCountdown, useCountdown } from "@/lib/hooks/useCountdown";

/**
 * Standing reminder for a signed-in user whose address is unconfirmed.
 *
 * Browsing stays open, so nothing yet stops them — but applying and posting
 * are closed until this is done, and finding that out at the moment of
 * applying is a bad way to learn it.
 */
/** Screens that already deal with sign-in or verification themselves. */
const AUTH_PATHS = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

export default function VerificationBanner() {
  const { user } = useAuth();
  const pathname = usePathname();

  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | undefined>();

  const cooldown = useCountdown(cooldownSeconds);

  /*
   * The auth screens speak for themselves: /verify-email is the whole
   * subject, and on /register or /login a reminder about some other account's
   * unconfirmed address is noise in front of the form the user came for.
   */
  const onAuthPage = AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // Nothing to say to a guest, a verified user, or someone who has closed it.
  if (!user || user.email_verified || dismissed || onAuthPage) return null;

  async function resend() {
    setSending(true);
    setError(null);

    try {
      const response = await authApi.resendVerification();
      setSent(true);
      setCooldownSeconds(response.retry_after ?? 60);
    } catch (err) {
      if (err instanceof ApiError && err.isRateLimited) {
        setCooldownSeconds(err.retryAfter ?? 60);
      } else {
        setError(err instanceof Error ? err.message : "Could not send the email.");
      }
    } finally {
      setSending(false);
    }
  }

  const waiting = cooldown > 0;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6"
    >
      <MailWarning className="h-5 w-5 shrink-0 text-amber-600" />

      <p className="min-w-0 flex-1 text-sm text-amber-900">
        {sent ? (
          <>
            A new link is on its way to{" "}
            <span className="font-medium">{user.email}</span>. Open it to finish
            setting up your account.
          </>
        ) : (
          /*
            Says what is required, not that an email was definitely delivered.
            Claiming "we sent a link" reads as a lie when the address is
            wrong, the mail was filtered, or the relay is down — and leaves
            the user waiting instead of pressing Resend.
          */
          <>
            Confirm <span className="font-medium">{user.email}</span> to apply
            for jobs and post content.
          </>
        )}
        {error && <span className="ml-1 text-red-700">{error}</span>}
      </p>

      <button
        onClick={resend}
        disabled={sending || waiting}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {waiting ? `Resend in ${formatCountdown(cooldown)}` : "Resend email"}
      </button>

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-1 text-amber-600 hover:bg-amber-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
