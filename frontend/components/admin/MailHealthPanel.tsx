"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Send } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { adminSettings } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/useApiResource";

/**
 * Shows whether outgoing mail is actually working.
 *
 * Every transactional email is queued, so the API answers 200 as soon as the
 * job is accepted — a user is told their verification link is on its way
 * while the job quietly fails. Without this panel the only sign of a broken
 * relay is users reporting they never got an email.
 */
export default function MailHealthPanel() {
  const { data, loading, refetch } = useApiResource(() => adminSettings.mailHealth(), []);

  const [address, setAddress] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const health = data?.data;

  async function sendTest() {
    setSending(true);
    setResult(null);

    try {
      const response = await adminSettings.sendTestEmail(address);
      setResult({ ok: true, message: response.message });
    } catch (err) {
      setResult({
        ok: false,
        message:
          err instanceof ApiError
            ? (err.fieldError("email") ?? err.message)
            : "Could not send the test message.",
      });
    } finally {
      setSending(false);
      // Picks up any failure the attempt just added to the queue.
      refetch();
    }
  }

  if (loading || !health) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-400">
        Checking mail configuration…
      </div>
    );
  }

  const failures = health.queue.failed;
  const healthy = health.delivers && failures === 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
      <div className="flex items-start gap-3">
        {healthy ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        )}

        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-900">Outgoing Email</h2>

          <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-slate-500">Mailer</dt>
              <dd className="font-medium text-slate-800">{health.mailer}</dd>
            </div>
            {health.host && (
              <div className="flex gap-2">
                <dt className="text-slate-500">Host</dt>
                <dd className="font-medium text-slate-800">{health.host}</dd>
              </div>
            )}
            {health.from && (
              <div className="flex gap-2">
                <dt className="text-slate-500">From</dt>
                <dd className="font-medium text-slate-800">{health.from}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="text-slate-500">Queue</dt>
              <dd className="font-medium text-slate-800">
                {health.queue.pending} waiting, {failures} failed
              </dd>
            </div>
          </dl>

          {!health.delivers && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Mail is written to the log file, not sent. Set{" "}
              <code className="font-mono text-xs">MAIL_MAILER=smtp</code> to deliver
              email.
            </p>
          )}

          {health.queue.last_failure && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              <p className="font-medium">
                Last failure — {health.queue.last_failure.failed_at}
              </p>
              <p className="mt-0.5 break-words font-mono text-xs">
                {health.queue.last_failure.reason}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <label htmlFor="mail-test" className="text-sm font-medium text-slate-700">
          Send a test message
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Sent immediately rather than queued, so the result here is the mail
          server&apos;s own answer.
        </p>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="mail-test"
            type="email"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            onClick={sendTest}
            disabled={sending || address.trim() === ""}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send test
          </button>
        </div>

        {result && (
          <p
            className={`mt-2 break-words text-sm ${
              result.ok ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {result.message}
          </p>
        )}
      </div>
    </div>
  );
}
