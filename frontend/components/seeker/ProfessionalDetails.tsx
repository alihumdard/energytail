"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { publicApi, seekerDetails } from "@/lib/api/endpoints";
import type { SeekerProfile } from "@/lib/api/types";
import { Check, Field, Grid, Select, TextArea } from "./Fields";
import { number, text } from "./useSection";

/**
 * Headline, summary and what the candidate is looking for.
 *
 * Loaded once and rendered as an uncontrolled form keyed by the loaded row,
 * so the inputs seed from defaultValue instead of a state write per keystroke.
 */

const AVAILABILITY = [
  { value: "immediate", label: "Immediately" },
  { value: "one_month", label: "Within a month" },
  { value: "two_months", label: "Within two months" },
  { value: "three_months", label: "Within three months" },
  { value: "not_looking", label: "Not actively looking" },
];

const VISIBILITY = [
  { value: "employers", label: "Employers only" },
  { value: "public", label: "Anyone" },
  { value: "private", label: "Nobody — keep it hidden" },
];

const PERIODS = [
  { value: "year", label: "per year" },
  { value: "month", label: "per month" },
  { value: "day", label: "per day" },
  { value: "hour", label: "per hour" },
];

interface Option {
  id: number;
  name: string;
}

export default function ProfessionalDetails({
  enabled,
  onSaved,
}: {
  enabled: boolean;
  /** Lets the page refresh the completeness meter after a save. */
  onSaved?: (profile: SeekerProfile) => void;
}) {
  const [profile, setProfile] = useState<SeekerProfile | null>(null);
  const [countries, setCountries] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    seekerDetails
      .get()
      .then(({ data }) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {});

    // The two dropdowns the profile needs. Failures leave the selects empty
    // rather than blocking the whole form.
    publicApi
      .countries()
      .then(({ data }) => {
        if (!cancelled) setCountries(data);
      })
      .catch(() => {});

    publicApi
      .jobCategories()
      .then(({ data }) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const { data } = await seekerDetails.update({
        headline: text(form, "headline"),
        summary: text(form, "summary"),
        country_id: number(form, "country_id"),
        job_category_id: number(form, "job_category_id"),
        experience_years: number(form, "experience_years"),
        expected_salary_min: number(form, "expected_salary_min"),
        expected_salary_max: number(form, "expected_salary_max"),
        expected_salary_currency: text(form, "expected_salary_currency"),
        salary_period: text(form, "salary_period"),
        availability: text(form, "availability"),
        open_to_remote: form.get("open_to_remote") !== null,
        open_to_relocation: form.get("open_to_relocation") !== null,
        website: text(form, "website"),
        linkedin_url: text(form, "linkedin_url"),
        visibility: text(form, "visibility") ?? "employers",
      });

      setProfile(data);
      setSaved(true);
      onSaved?.(data);
    } catch (err) {
      setError(err instanceof ApiError ? err : null);
    } finally {
      setBusy(false);
    }
  }

  if (profile === null) {
    return (
      <section className="rounded-2xl border border-slate-100 bg-white p-5">
        <p className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your profile…
        </p>
      </section>
    );
  }

  const asText = (value: number | string | null) =>
    value === null ? "" : String(value);

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5"
    >
      <h2 className="font-semibold text-slate-900">Professional details</h2>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error.detail}
        </p>
      )}

      {saved && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          Profile saved.
        </p>
      )}

      <Grid>
        <Field
          label="Headline"
          name="headline"
          span
          placeholder="Subsea Engineer · 12 years offshore"
          defaultValue={profile.headline}
        />
        <TextArea
          label="About you"
          name="summary"
          rows={4}
          placeholder="A short summary an employer will read first."
          defaultValue={profile.summary}
        />

        <Select
          label="Based in"
          name="country_id"
          defaultValue={asText(profile.country_id)}
          options={countries.map((c) => ({
            value: String(c.id),
            label: c.name,
          }))}
        />
        <Select
          label="Primary field"
          name="job_category_id"
          defaultValue={asText(profile.job_category_id)}
          options={categories.map((c) => ({
            value: String(c.id),
            label: c.name,
          }))}
        />

        <Field
          label="Years of experience"
          name="experience_years"
          type="number"
          defaultValue={asText(profile.experience_years)}
        />
        <Select
          label="Available"
          name="availability"
          defaultValue={profile.availability}
          options={AVAILABILITY}
        />

        <Field
          label="Expected salary from"
          name="expected_salary_min"
          type="number"
          defaultValue={asText(profile.expected_salary_min)}
        />
        <Field
          label="up to"
          name="expected_salary_max"
          type="number"
          defaultValue={asText(profile.expected_salary_max)}
        />
        <Field
          label="Currency"
          name="expected_salary_currency"
          placeholder="USD"
          defaultValue={profile.expected_salary_currency}
        />
        <Select
          label="Period"
          name="salary_period"
          defaultValue={profile.salary_period}
          options={PERIODS}
          placeholder="per year"
        />

        <Check
          label="Open to remote work"
          name="open_to_remote"
          defaultChecked={profile.open_to_remote}
        />
        <Check
          label="Willing to relocate"
          name="open_to_relocation"
          defaultChecked={profile.open_to_relocation}
        />

        <Field
          label="Website"
          name="website"
          type="url"
          placeholder="https://"
          defaultValue={profile.website}
        />
        <Field
          label="LinkedIn"
          name="linkedin_url"
          type="url"
          placeholder="https://linkedin.com/in/…"
          defaultValue={profile.linkedin_url}
        />

        <Select
          label="Who can see this profile"
          name="visibility"
          defaultValue={profile.visibility}
          options={VISIBILITY}
          placeholder="Employers only"
        />
      </Grid>

      <button
        type="submit"
        disabled={busy}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save size={16} />
        )}
        Save details
      </button>
    </form>
  );
}
