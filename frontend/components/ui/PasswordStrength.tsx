"use client";

import { Check, X } from "lucide-react";

/**
 * Live checklist for the password rules the API enforces.
 *
 * These mirror the backend's Password::min(8)->letters()->mixedCase()
 * ->numbers()->symbols() rule. Kept in sync by hand — a mismatch shows up as a
 * form that looks satisfied and is then rejected on submit.
 */
const RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
  {
    label: "One symbol",
    // Anything that is not a letter, a digit or whitespace. Matches the
    // backend, which accepts any non-alphanumeric character.
    test: (v: string) => /[^A-Za-z0-9\s]/.test(v),
  },
] as const;

const BARS = [
  { label: "Weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", bar: "bg-yellow-500", text: "text-yellow-700" },
  { label: "Strong", bar: "bg-lime-500", text: "text-lime-700" },
  { label: "Very strong", bar: "bg-emerald-500", text: "text-emerald-600" },
] as const;

export default function PasswordStrength({ value }: { value: string }) {
  // Nothing typed yet: showing five red crosses greets the user with failure.
  if (!value) return null;

  const results = RULES.map((rule) => ({ ...rule, passed: rule.test(value) }));
  const passed = results.filter((r) => r.passed).length;
  const strength = BARS[Math.max(0, passed - 1)];

  return (
    <div className="mt-2.5">
      <div className="flex items-center gap-2">
        <div
          className="flex-1 flex gap-1"
          role="progressbar"
          aria-valuenow={passed}
          aria-valuemin={0}
          aria-valuemax={RULES.length}
          aria-label="Password strength"
        >
          {RULES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < passed ? strength.bar : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium shrink-0 ${strength.text}`}>
          {strength.label}
        </span>
      </div>

      <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {results.map((rule) => (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 text-xs ${
              rule.passed ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            {rule.passed ? (
              <Check className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0" />
            )}
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** True when every rule the API enforces is satisfied. */
export function isPasswordValid(value: string): boolean {
  return RULES.every((rule) => rule.test(value));
}
