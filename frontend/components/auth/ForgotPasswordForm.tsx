"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Mail, Send } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { auth as authApi } from "@/lib/api/endpoints";
import { getCaptchaToken } from "@/lib/auth/captcha";
import { formatCountdown, useCountdown } from "@/lib/hooks/useCountdown";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Above the success branch below: hooks cannot be called conditionally, and
  // the early return would otherwise skip this one.
  const cooldown = useCountdown(error?.isRateLimited ? error.retryAfter : undefined);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await authApi.forgotPassword(email, await getCaptchaToken("forgot_password"));
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err
          : new ApiError(0, "Could not reach the server. Check your connection."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800 text-sm">Check your inbox</p>
            {/*
              Deliberately non-committal about whether the address exists: the
              API answers the same way either way, so this endpoint cannot be
              used to discover who has an account.
            */}
            <p className="text-sm text-slate-600 mt-1">
              If <span className="font-medium">{email}</span> is registered, a password reset link
              is on its way. The link expires in 60 minutes.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              Use a different address
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Only the email field renders an error inline, so anything else has to
  // reach the banner or the form goes quiet on failure.
  const generalError =
    error && !error.fieldError("email") && !error.isRateLimited ? error.message : null;

  const throttled = Boolean(error?.isRateLimited) && cooldown > 0;

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
      {throttled && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <p className="font-medium">Too many requests</p>
          <p className="mt-0.5">
            Wait {formatCountdown(cooldown)} before asking for another link.
          </p>
        </div>
      )}

      {generalError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {generalError}
        </div>
      )}

      <FormField
        label="Email Address"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="Enter your registered email address"
        icon={Mail}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error?.fieldError("email")}
      />

      <PrimaryButton
        type="submit"
        disabled={submitting || throttled}
        icon={<Send className="w-4 h-4" />}
        className={submitting || throttled ? "opacity-70 cursor-not-allowed" : ""}
      >
        {submitting
          ? "Sending…"
          : throttled
            ? `Try again in ${formatCountdown(cooldown)}`
            : "Send Reset Link"}
      </PrimaryButton>

      <p className="text-center text-sm text-slate-500">
        Remembered it?{" "}
        <a href="/login" className="text-blue-600 font-medium hover:underline">
          Back to login
        </a>
      </p>
    </form>
  );
}
