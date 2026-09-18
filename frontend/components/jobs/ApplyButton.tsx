"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Send } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Sends a candidate to the employer, recording the click on the way past.
 *
 * Applications leave the platform — the plan has no applicant tracking — so
 * this is a click-through, not a form. The destination is deliberately not in
 * the page payload: it comes back from the API only once the click is
 * recorded, which is the only performance figure an employer gets.
 */
export default function ApplyButton({
  slug,
  method,
}: {
  slug: string;
  method: string | null;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    setBusy(true);
    setError(null);

    try {
      const { data } = await apiFetch<{ data: { method: string; target: string } }>(
        `/jobs/${slug}/apply`,
        { method: "POST" },
      );

      /*
       * A new tab, not a redirect: the candidate keeps the listing open to
       * refer back to while filling in the employer's own form.
       */
      window.open(data.target, "_blank", "noopener,noreferrer");
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(`/jobs/${slug}`)}`);
        return;
      }

      if (err instanceof ApiError && err.code === "email_not_verified") {
        setError("Confirm your email address before applying.");
        setBusy(false);
        return;
      }

      setError(err instanceof ApiError ? err.detail : "Could not open the application.");
      setBusy(false);
      return;
    }

    setBusy(false);
  }

  // Guests get the same button; it sends them to sign in, which is a clearer
  // path than hiding the only action on the page.
  const label = !loading && !user ? "Sign in to apply" : "Apply Now";

  return (
    <div>
      <button
        onClick={apply}
        disabled={busy || loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : method === "external_url" ? (
          <ExternalLink className="h-4 w-4" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {label}
      </button>

      {method === "external_url" && (
        <p className="mt-2 text-center text-xs text-slate-400">
          Applications are handled on the employer&apos;s own site.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
