"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MailCheck, RefreshCw, XCircle } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { auth as authApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";

type Status = "idle" | "verifying" | "verified" | "failed";

export default function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const { user, refresh } = useAuth();

  /*
   * The email links to the frontend carrying the signed API URL as a query
   * parameter. Signing against the API route keeps the signature valid while
   * still landing the user on a real page rather than raw JSON.
   */
  const signedUrl = searchParams.get("url");

  // Starts as "verifying" when a link is present, so the initial paint already
  // shows the spinner rather than flashing the idle panel first.
  const [status, setStatus] = useState<Status>(signedUrl ? "verifying" : "idle");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!signedUrl) return;

    let cancelled = false;

    const verify = async () => {
      try {
        const response = await fetch(signedUrl, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new ApiError(
            response.status,
            payload?.message ?? "Verification failed.",
            payload?.code,
          );
        }

        if (cancelled) return;

        setStatus("verified");
        setMessage(payload?.message ?? "Your email address has been verified.");

        // Refresh so the rest of the app sees the verified flag immediately.
        refresh();
      } catch (err) {
        if (cancelled) return;

        setStatus("failed");
        setMessage(
          err instanceof ApiError ? err.message : "This verification link could not be used.",
        );
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [signedUrl, refresh]);

  async function resend() {
    setResending(true);
    setResent(false);

    try {
      await authApi.resendVerification();
      setResent(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not send the email.");
    } finally {
      setResending(false);
    }
  }

  if (status === "verifying") {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <p className="text-sm text-slate-600">Verifying your email address…</p>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800 text-sm">Email verified</p>
            <p className="text-sm text-slate-600 mt-1">{message}</p>
            <a
              href="/dashboard"
              className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Continue to your dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800 text-sm">Verification failed</p>
            <p className="text-sm text-slate-600 mt-1">{message}</p>
            {user && (
              <button
                onClick={resend}
                disabled={resending}
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline disabled:opacity-60"
              >
                {resending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Send a new link
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No link in the URL: the user landed here straight after registering.
  return (
    <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
      <div className="flex items-start gap-3">
        <MailCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-800 text-sm">Check your inbox</p>
          <p className="text-sm text-slate-600 mt-1">
            {user?.email ? (
              <>
                We sent a verification link to{" "}
                <span className="font-medium">{user.email}</span>. Open it to activate your
                account.
              </>
            ) : (
              "We sent you a verification link. Open it to activate your account."
            )}
          </p>

          {resent && (
            <p className="mt-2 text-sm font-medium text-emerald-600">
              A new verification email is on its way.
            </p>
          )}

          {user && (
            <button
              onClick={resend}
              disabled={resending}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline disabled:opacity-60"
            >
              {resending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Resend the email
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
