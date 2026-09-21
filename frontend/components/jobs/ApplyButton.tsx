"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Mail, Send } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";

interface ApplyTarget {
  apply_method: string;
  apply_email: string | null;
  apply_url: string | null;
}

/**
 * Sends a candidate to the employer, recording the click on the way past.
 *
 * Applications leave the platform — the plan has no applicant tracking — so
 * this is a click-through, not a form. The destination is not in the job
 * page's own payload, because that response is cached with no session
 * attached and cannot vary per visitor. A signed-in job seeker instead sees
 * it up front via a separate, uncached, session-aware lookup — clicking
 * "Apply Now" still records the click and returns the target the same way
 * for everyone, signed in or not.
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
  const [target, setTarget] = useState<ApplyTarget | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    apiFetch<{ data: ApplyTarget | null }>(`/jobs/${slug}/apply-target`)
      .then(({ data }) => {
        if (!cancelled) setTarget(data);
      })
      .catch(() => {
        // Silent: the button still works without this preview — the click
        // itself is what resolves the destination.
      });

    return () => {
      cancelled = true;
    };
  }, [user, slug]);

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

      {target?.apply_email && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          Apply by email:{" "}
          <a href={`mailto:${target.apply_email}`} className="font-medium text-blue-600 hover:underline">
            {target.apply_email}
          </a>
        </p>
      )}

      {target?.apply_url && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <a
            href={target.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:underline"
          >
            {target.apply_url}
          </a>
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
