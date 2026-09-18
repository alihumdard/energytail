"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building,
  ClipboardList,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { auth as authApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useDebounced } from "@/lib/hooks/useApiResource";
import FormField from "@/components/ui/FormField";
import PasswordStrength, { isPasswordValid } from "@/components/ui/PasswordStrength";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Divider from "@/components/ui/Divider";
import SocialAuthButtons from "@/components/ui/SocialAuthButtons";
import { GoogleIcon, LinkedinIcon } from "@/components/SocialIcons";

/** Matches the roles the API accepts at registration — administrator is not one. */
const ACCOUNT_TYPES = [
  { value: "job_seeker", icon: User, title: "Job Seeker", desc: "I want to find a job" },
  { value: "employer", icon: Building, title: "Employer", desc: "I want to hire talent" },
  { value: "author", icon: ClipboardList, title: "Article Author", desc: "I want to write articles" },
] as const;

type AccountType = (typeof ACCOUNT_TYPES)[number]["value"];

export default function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    company_name: "",
    company_website: "",
  });
  const [role, setRole] = useState<AccountType>("job_seeker");
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  const isEmployer = role === "employer";

  // Checked against the server once the address stops changing, so a taken
  // email surfaces before the rest of the form is filled in.
  const debouncedEmail = useDebounced(form.email, 500);

  /*
   * Holds the address the answer applies to, not just the verdict. Keying it
   * this way means a result that arrives after the user has typed on is
   * ignored during render, so nothing has to be cleared from an effect.
   */
  const [taken, setTaken] = useState<{ email: string; value: boolean } | null>(null);

  useEffect(() => {
    const email = debouncedEmail.trim();

    // Anything that cannot be an address is the browser's job to complain
    // about, not worth a request.
    if (!email || !email.includes("@") || !email.includes(".")) return;

    let cancelled = false;

    authApi
      .emailAvailable(email)
      .then(({ data }) => {
        if (!cancelled) setTaken({ email, value: !data.available });
      })
      .catch(() => {
        // Availability is a convenience. If the check fails the user can
        // still submit, and the API rejects a duplicate anyway.
        if (!cancelled) setTaken({ email, value: false });
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedEmail]);

  const emailTaken = taken?.email === form.email.trim() && taken.value;

  const passwordsMatch =
    form.password_confirmation === "" || form.password === form.password_confirmation;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { company_name, company_website, ...common } = form;

      await register({
        ...common,
        role,
        terms_accepted: terms,
        // Sent only for employers: the API rejects them as unexpected input
        // for the other two roles, where they mean nothing.
        ...(isEmployer ? { company_name, company_website } : {}),
      });

      // Registration signs the user in, so the next step is verifying their
      // address rather than signing in again.
      router.push("/verify-email");
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

  /*
   * Fields with their own inline error slot below. Anything the API reports
   * outside this set has nowhere to render, so it falls through to the banner
   * instead of leaving the form silent — which reads as "nothing happened".
   */
  const INLINE_FIELDS = [
    "first_name",
    "last_name",
    "email",
    "password",
    "role",
    "terms_accepted",
    "company_name",
    "company_website",
  ];

  const hasInlineError = INLINE_FIELDS.some((field) => error?.fieldError(field));
  const generalError = error && !hasInlineError ? error.message : null;

  /*
   * Blocks a submit that the API is certain to reject. The server validates
   * all of this again — this only saves the user a round trip and a form that
   * comes back covered in errors.
   */
  const canSubmit =
    !submitting &&
    !emailTaken &&
    form.first_name.trim() !== "" &&
    form.last_name.trim() !== "" &&
    form.email.trim() !== "" &&
    isPasswordValid(form.password) &&
    form.password === form.password_confirmation &&
    terms &&
    (!isEmployer || form.company_name.trim() !== "");

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

      <div>
        <h3 className="font-semibold text-slate-800 text-sm mb-3">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="First Name"
            name="first_name"
            required
            autoComplete="given-name"
            placeholder="Enter your first name"
            icon={User}
            value={form.first_name}
            onChange={update("first_name")}
            error={error?.fieldError("first_name")}
          />
          <FormField
            label="Last Name"
            name="last_name"
            required
            autoComplete="family-name"
            placeholder="Enter your last name"
            icon={User}
            value={form.last_name}
            onChange={update("last_name")}
            error={error?.fieldError("last_name")}
          />
        </div>
      </div>

      <FormField
        label="Email Address"
        name="email"
        required
        type="email"
        autoComplete="email"
        placeholder="Enter your email address"
        icon={Mail}
        value={form.email}
        onChange={update("email")}
        error={
          error?.fieldError("email") ??
          (emailTaken ? "An account already uses this address." : undefined)
        }
      />

      {emailTaken && !error?.fieldError("email") && (
        <p className="-mt-3 text-sm text-slate-500">
          Already registered?{" "}
          <a href="/login" className="text-blue-600 font-medium hover:underline">
            Sign in instead
          </a>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Password"
          name="password"
          required
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Create a password"
          icon={Lock}
          paddingClass="pr-9 py-2.5"
          value={form.password}
          onChange={update("password")}
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
          label="Confirm Password"
          name="password_confirmation"
          required
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Confirm your password"
          icon={Lock}
          value={form.password_confirmation}
          onChange={update("password_confirmation")}
          error={passwordsMatch ? undefined : "Both passwords must match."}
        />
      </div>

      {/* Replaces the static rule text: the same rules, ticked off as met. */}
      <div className="-mt-3">
        <PasswordStrength value={form.password} />
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 text-sm mb-1">Account Type</h3>
        <label className="text-sm text-slate-700 font-medium">
          Join as <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {ACCOUNT_TYPES.map((a) => {
            const selected = role === a.value;

            return (
              <button
                type="button"
                key={a.value}
                onClick={() => setRole(a.value)}
                aria-pressed={selected}
                className={`text-left rounded-xl border p-4 transition ${
                  selected
                    ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <a.icon className={`w-6 h-6 ${selected ? "text-blue-600" : "text-slate-400"}`} />
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selected ? "border-blue-600" : "border-slate-300"
                    }`}
                  >
                    {selected && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                  </span>
                </div>
                <div className="font-semibold text-sm text-slate-800 mt-3">{a.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{a.desc}</div>
              </button>
            );
          })}
        </div>
        {error?.fieldError("role") && (
          <p className="mt-1.5 text-xs text-red-600">{error.fieldError("role")}</p>
        )}
      </div>

      {/*
        Employers only. The company is created with the account, so an
        employer never lands on their dashboard with nothing to post under.
      */}
      {isEmployer && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Company Details</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Your jobs will be posted under this company. You can add the rest later.
            </p>
          </div>

          <FormField
            label="Company Name"
            name="company_name"
            required
            autoComplete="organization"
            placeholder="e.g. PetroEnergy Solutions"
            icon={Building}
            value={form.company_name}
            onChange={update("company_name")}
            error={error?.fieldError("company_name")}
          />

          <FormField
            label="Company Website"
            name="company_website"
            type="url"
            autoComplete="url"
            placeholder="https://example.com"
            icon={Globe}
            value={form.company_website}
            onChange={update("company_website")}
            error={error?.fieldError("company_website")}
          />
        </div>
      )}

      <div>
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            I agree to the{" "}
            {/* New tab: a half-filled registration form should survive
                someone reading what they are agreeing to. */}
            <Link
              href="/terms"
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Privacy Policy
            </Link>{" "}
            <span className="text-red-500">*</span>
          </span>
        </label>
        {error?.fieldError("terms_accepted") && (
          <p className="mt-1.5 text-xs text-red-600">{error.fieldError("terms_accepted")}</p>
        )}
      </div>

      <PrimaryButton
        type="submit"
        disabled={!canSubmit}
        icon={<UserPlus className="w-4 h-4" />}
        className={!canSubmit ? "opacity-70 cursor-not-allowed" : ""}
      >
        {submitting ? "Creating account…" : "Create Account"}
      </PrimaryButton>

      <Divider label="or register with" />

      {/* The chosen role rides along so social sign-up lands on the same one. */}
      <SocialAuthButtons
        providers={[
          { label: "Google", icon: GoogleIcon, href: authApi.socialRedirectUrl("google", role) },
          {
            label: "LinkedIn",
            icon: LinkedinIcon,
            iconClassName: "text-[#0A66C2]",
            href: authApi.socialRedirectUrl("linkedin", role),
          },
        ]}
        columns={2}
      />
    </form>
  );
}
