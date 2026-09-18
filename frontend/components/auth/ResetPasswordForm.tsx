"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { auth as authApi } from "@/lib/api/endpoints";
import { getCaptchaToken } from "@/lib/auth/captcha";
import FormField from "@/components/ui/FormField";
import PasswordStrength, { isPasswordValid } from "@/components/ui/PasswordStrength";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Both arrive on the link in the reset email.
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await authApi.resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmation,
        captcha_token: await getCaptchaToken("reset_password"),
      });

      router.push("/login?reset=1");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err
          : new ApiError(0, "Could not reach the server. Check your connection."),
      );
      setSubmitting(false);
    }
  }

  // Landing here without a token means the link was mistyped or truncated by
  // an email client — say so rather than failing on submit.
  if (!token || !email) {
    return (
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800 text-sm">This link is incomplete</p>
            <p className="text-sm text-slate-600 mt-1">
              Open the reset link directly from your email, or request a new one.
            </p>
            <a
              href="/forgot-password"
              className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Request a new link
            </a>
          </div>
        </div>
      </div>
    );
  }

  const expiredToken = error?.code === "invalid_reset_token";

  /*
   * The expired-token case has its own panel below, and the password field
   * shows its own errors, so the banner covers only what is left. Testing
   * "not a validation error" instead rendered two banners at once for an
   * expired link, and swallowed a 422 raised against any other field.
   */
  const generalError =
    error && !expiredToken && !error.fieldError("password") && !error.isRateLimited
      ? error.message
      : null;

  const passwordsMatch = confirmation === "" || password === confirmation;
  const canSubmit =
    !submitting && isPasswordValid(password) && password === confirmation;

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
      {generalError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {generalError}
        </div>
      )}

      {expiredToken && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          This reset link has expired or has already been used.{" "}
          <a href="/forgot-password" className="font-medium underline">
            Request a new one
          </a>
          .
        </div>
      )}

      <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Resetting the password for <span className="font-medium text-slate-800">{email}</span>
      </div>

      <FormField
        label="New Password"
        name="password"
        required
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Create a new password"
        icon={Lock}
        paddingClass="pr-9 py-2.5"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error?.fieldError("password")}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />

      <FormField
        label="Confirm New Password"
        name="password_confirmation"
        required
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Repeat the new password"
        icon={Lock}
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        error={passwordsMatch ? undefined : "Both passwords must match."}
      />

      {/* Same live checklist as registration, in place of static rule text. */}
      <div className="-mt-3">
        <PasswordStrength value={password} />
      </div>

      <PrimaryButton
        type="submit"
        disabled={!canSubmit}
        icon={<KeyRound className="w-4 h-4" />}
        className={!canSubmit ? "opacity-70 cursor-not-allowed" : ""}
      >
        {submitting ? "Updating…" : "Reset Password"}
      </PrimaryButton>
    </form>
  );
}
