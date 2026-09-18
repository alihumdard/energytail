"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { newsletter } from "@/lib/api/endpoints";

/**
 * Newsletter signup.
 *
 * Confirmed opt-in: submitting sends a confirmation email rather than adding
 * the address to the list, so the copy has to promise the inbox step instead
 * of implying it is done.
 */
export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setBusy(true);

    try {
      await newsletter.subscribe(email.trim());
      setDone(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-[#0B2B26] px-6 py-10 text-center text-white sm:px-10">
      <Mail className="mx-auto mb-3 text-blue-400" size={26} />
      <h2 className="text-2xl font-bold">Get new roles in your inbox</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">
        A short digest of what has been posted across oil, gas and renewables.
        Unsubscribe from any email.
      </p>

      {done ? (
        <p className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 size={16} />
          Check your inbox to confirm your subscription.
        </p>
      ) : (
        <form
          onSubmit={submit}
          className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row sm:gap-2"
          noValidate
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full flex-1 rounded-lg border border-white/10 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 sm:py-2.5"
          />
          <button
            type="submit"
            disabled={busy || email.trim() === ""}
            className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-md disabled:opacity-50 sm:w-auto sm:py-2.5"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Subscribe
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
