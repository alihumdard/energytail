"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, LogIn, Mail } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { auth as authApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatCountdown, useCountdown } from "@/lib/hooks/useCountdown";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Divider from "@/components/ui/Divider";
import SocialAuthButtons from "@/components/ui/SocialAuthButtons";
import { GoogleIcon, LinkedinIcon } from "@/components/SocialIcons";
import type { User } from "@/lib/api/types";

/**
 * Sends each account to a screen it can actually open.
 *
 * Named roles first, since those own a whole workspace. A custom role built
 * in the admin panel matches none of them, so it falls through to the first
 * admin screen its permissions cover — landing it on the seeker dashboard
 * would be a page its role cannot use.
 */
function landingFor(user: User): string {
  if (user.roles.includes("administrator")) return "/admin/dashboard";
  if (user.roles.includes("employer")) return "/employer-dashboard";
  if (user.roles.includes("author")) return "/author-dashboard";
  if (user.roles.includes("job_seeker")) return "/dashboard";

  const admin: [string, string][] = [
    ["users.view", "/admin/dashboard"],
    ["companies.approve", "/admin/companies"],
    ["jobs.approve", "/admin/jobs"],
    ["articles.approve", "/admin/articles"],
    ["comments.approve", "/admin/comments"],
    ["taxonomy.view", "/admin/job-categories"],
    ["roles.view", "/admin/roles-permissions"],
    ["settings.view", "/admin/settings"],
    ["audit_logs.view", "/admin/audit-logs"],
  ];

  const match = admin.find(([permission]) =>
    user.permissions.includes(permission),
  );

  return match ? match[1] : "/dashboard";
}

export default function LoginForm() {
  const { login, user, refresh } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  /*
   * Guest-only routing lives here rather than in proxy.ts, which sees only
   * cookies — and Laravel issues a session cookie to anonymous visitors too,
   * so there is no way to tell a guest from a signed-in user before the API
   * has been asked.
   */
  useEffect(() => {
    if (user) router.replace(landingFor(user));
  }, [user, router]);

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
      router.push(
        redirect && redirect.startsWith("/") ? redirect : landingFor(user),
      );
      router.refresh();
    } catch (err) {
      /*
       * A session was already open — most often a tab left sitting on the
       * login page. There is nothing for the user to fix, so adopt the
       * existing session and move on rather than showing an error.
       */
      if (err instanceof ApiError && err.code === "already_authenticated") {
        const current = await refresh();
        router.push(current ? landingFor(current) : "/dashboard");
        router.refresh();
        return;
      }

      setError(
        err instanceof ApiError
          ? err
          : new ApiError(
              0,
              "Could not reach the server. Check your connection.",
            ),
      );
      setSubmitting(false);
    }
  }

  /*
   * Account-standing failures arrive against the 'email' field like a wrong
   * password does, but carry a code. They belong in the banner: retyping the
   * password will never fix a suspension, so showing it under the field
   * invites the user to keep trying.
   */
  const standingCode =
    error?.code === "account_suspended" || error?.code === "account_closed";

  const credentialError = standingCode ? undefined : error?.fieldError("email");
  const passwordError = error?.fieldError("password");

  // Ticks down while the throttle is in force, so the button can re-arm
  // itself instead of the user guessing when to try again.
  const cooldown = useCountdown(
    error?.isRateLimited ? error.retryAfter : undefined,
  );
  const throttled = Boolean(error?.isRateLimited) && cooldown > 0;

  /*
   * Anything the two field slots above will not render has to surface here.
   * Showing the banner only for non-validation errors used to swallow a 422
   * raised against any other field — the form simply went quiet, which reads
   * as "nothing happened" rather than as a failure.
   */
  const generalError =
    error && !credentialError && !passwordError && !error.isRateLimited
      ? error.message
      : null;

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
      {throttled && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <p className="font-medium">Too many sign-in attempts</p>
          <p className="mt-0.5">
            Wait {formatCountdown(cooldown)} before trying again. If you have
            forgotten your password,{" "}
            <a href="/forgot-password" className="font-medium underline">
              reset it
            </a>
            .
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
        error={passwordError}
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
        <a
          href="/forgot-password"
          className="text-blue-600 font-medium hover:underline"
        >
          Forgot Password?
        </a>
      </div>

      <PrimaryButton
        type="submit"
        disabled={submitting || throttled}
        icon={<LogIn className="w-4 h-4" />}
        className={
          submitting || throttled ? "opacity-70 cursor-not-allowed" : ""
        }
      >
        {submitting
          ? "Signing in…"
          : throttled
            ? `Try again in ${formatCountdown(cooldown)}`
            : "Login"}
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
        <a
          href="/register"
          className="text-blue-600 font-medium hover:underline"
        >
          Register Now
        </a>
      </p>
    </form>
  );
}
