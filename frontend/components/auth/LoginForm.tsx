"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, LogIn, Mail } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { auth as authApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Divider from "@/components/ui/Divider";
import SocialAuthButtons from "@/components/ui/SocialAuthButtons";
import { GoogleIcon, LinkedinIcon } from "@/components/SocialIcons";
import type { User } from "@/lib/api/types";

/** Sends each role to the dashboard that role actually uses. */
function landingFor(user: User): string {
  if (user.roles.includes("administrator")) return "/admin/dashboard";
  if (user.roles.includes("employer")) return "/employer-dashboard";
  if (user.roles.includes("author")) return "/author-dashboard";
  return "/dashboard";
}

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const user = await login(email, password, remember);

      // Honour where the user was headed before being sent to sign in,
      // falling back to the dashboard for their role.
      const redirect = searchParams.get("redirect");
      router.push(redirect && redirect.startsWith("/") ? redirect : landingFor(user));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err
          : new ApiError(0, "Could not reach the server. Check your connection."),
      );
      setSubmitting(false);
    }
  }

  // The API returns credential failures against the email field, so a wrong
  // password shows there rather than in a generic banner.
  const credentialError = error?.fieldError("email");
  const generalError =
    error && !credentialError && !error.isValidation ? error.message : null;

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

      <FormField
        label="Email Address"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="Enter your email address"
        icon={Mail}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={credentialError}
      />

      <FormField
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        required
        placeholder="Enter your password"
        icon={Lock}
        paddingClass="pr-14 py-2.5"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error?.fieldError("password")}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-medium"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        }
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Remember me
        </label>
        <a href="/forgot-password" className="text-blue-600 font-medium hover:underline">
          Forgot Password?
        </a>
      </div>

      <PrimaryButton
        type="submit"
        disabled={submitting}
        icon={<LogIn className="w-4 h-4" />}
        className={submitting ? "opacity-70 cursor-not-allowed" : ""}
      >
        {submitting ? "Signing in…" : "Login"}
      </PrimaryButton>

      <Divider label="or continue with" />

      {/*
        Full-page navigation rather than fetch: the provider renders its own
        consent screen, which cannot happen inside an XHR request.
      */}
      <SocialAuthButtons
        providers={[
          {
            label: "Google",
            icon: GoogleIcon,
            href: authApi.socialRedirectUrl("google"),
          },
          {
            label: "LinkedIn",
            icon: LinkedinIcon,
            iconClassName: "text-[#0A66C2]",
            href: authApi.socialRedirectUrl("linkedin"),
          },
        ]}
        columns={2}
      />

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <a href="/register" className="text-blue-600 font-medium hover:underline">
          Register Now
        </a>
      </p>
    </form>
  );
}
