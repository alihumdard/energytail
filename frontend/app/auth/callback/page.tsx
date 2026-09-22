"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { auth as authApi } from "@/lib/api/endpoints";
import type { User } from "@/lib/api/types";

/** Messages for the error codes SocialAuthController redirects with. */
const ERROR_MESSAGES: Record<string, string> = {
  social_failed: "We could not complete sign-in with that provider. Please try again.",
  account_suspended: "This account has been suspended. Contact support for help.",
  unsupported_provider: "That sign-in provider is not available.",
  too_many_requests: "Too many attempts. Please wait a minute and try again.",
};

function landingFor(user: User): string {
  if (user.roles.includes("administrator")) return "/admin/dashboard";
  if (user.roles.includes("employer")) return "/employer-dashboard";
  if (user.roles.includes("author")) return "/author-dashboard";
  return "/dashboard";
}

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const errorCode = searchParams.get("error");
  const status = searchParams.get("status");

  // Derived during render rather than set in an effect: these come straight
  // from the URL, so there is nothing to synchronise.
  const redirectError = errorCode
    ? (ERROR_MESSAGES[errorCode] ?? "Sign-in failed. Please try again.")
    : status !== "success"
      ? "Sign-in did not complete. Please try again."
      : null;

  const [loadError, setLoadError] = useState<string | null>(null);
  const error = redirectError ?? loadError;

  useEffect(() => {
    if (redirectError) return;

    // The backend already established the session cookie during the OAuth
    // round trip; this loads the user it belongs to.
    let cancelled = false;

    async function complete() {
      try {
        await refresh();
        const { data } = await authApi.me();
        if (!cancelled) router.replace(landingFor(data));
      } catch {
        if (!cancelled) {
          setLoadError("Signed in, but we could not load your account. Try signing in again.");
        }
      }
    }

    complete();

    return () => {
      cancelled = true;
    };
  }, [redirectError, refresh, router]);

  if (error) {
    return (
      <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">Sign-in failed</p>
            <p className="text-sm text-slate-600 mt-1">{error}</p>
            <a
              href="/login"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Back to login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-slate-600">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      <p className="text-sm">Completing sign-in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-sm">Completing sign-in…</p>
          </div>
        }
      >
        <CallbackHandler />
      </Suspense>
    </main>
  );
}
