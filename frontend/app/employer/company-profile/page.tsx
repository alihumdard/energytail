"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Save,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { employerCompany, publicApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { EmployerCompany, TaxonomyItem } from "@/lib/api/types";
import RoleShell from "@/components/RoleShell";

const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

const EMPTY = {
  name: "",
  description: "",
  website: "",
  email: "",
  phone: "",
  address: "",
  industry_id: "",
  country_id: "",
  city_id: "",
  company_size: "",
  founded_year: "",
};

export default function CompanyProfilePage() {
  const { user, loading: authLoading } = useAuth();

  const [company, setCompany] = useState<EmployerCompany | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [industries, setIndustries] = useState<TaxonomyItem[]>([]);
  const [countries, setCountries] = useState<TaxonomyItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    employerCompany
      .get()
      .then(({ data }) => {
        if (cancelled) return;

        setCompany(data);

        if (data) {
          setForm({
            name: data.name ?? "",
            description: data.description ?? "",
            website: data.website ?? "",
            email: data.email ?? "",
            phone: data.phone ?? "",
            address: data.address ?? "",
            industry_id: data.industry_id ? String(data.industry_id) : "",
            country_id: data.country_id ? String(data.country_id) : "",
            city_id: data.city_id ? String(data.city_id) : "",
            company_size: data.company_size ?? "",
            founded_year: data.founded_year ? String(data.founded_year) : "",
          });
        }
      })
      .catch(() => {
        // Leaves the form empty, which is the create path.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([publicApi.industries(), publicApi.countries()])
      .then(([inds, ctys]) => {
        if (cancelled) return;
        setIndustries(inds.data);
        setCountries(ctys.data);
      })
      .catch(() => {
        // Both selects are optional.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Cities depend on the chosen country, stored with the country they belong
   * to. The render ignores them when the two disagree — clearing the list
   * from an effect instead would briefly show the previous country's cities.
   */
  const [loadedCities, setLoadedCities] = useState<{
    countryId: string;
    items: TaxonomyItem[];
  }>({ countryId: "", items: [] });

  useEffect(() => {
    if (!form.country_id) return;

    let cancelled = false;

    publicApi
      .cities(Number(form.country_id))
      .then(({ data }) => {
        if (!cancelled) setLoadedCities({ countryId: form.country_id, items: data });
      })
      .catch(() => {
        if (!cancelled) setLoadedCities({ countryId: form.country_id, items: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [form.country_id]);

  const cities = loadedCities.countryId === form.country_id ? loadedCities.items : [];

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = { name: form.name };

      // Blank optionals are sent as null so clearing a field actually clears
      // it, rather than being omitted and silently kept.
      payload.description = form.description || null;
      payload.website = form.website || null;
      payload.email = form.email || null;
      payload.phone = form.phone || null;
      payload.address = form.address || null;
      payload.company_size = form.company_size || null;
      payload.industry_id = form.industry_id ? Number(form.industry_id) : null;
      payload.country_id = form.country_id ? Number(form.country_id) : null;
      payload.city_id = form.city_id ? Number(form.city_id) : null;
      payload.founded_year = form.founded_year ? Number(form.founded_year) : null;

      const { data } = company
        ? await employerCompany.update(company.id, payload)
        : await employerCompany.create(payload);

      setCompany(data);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "Could not reach the server."));
    } finally {
      setSaving(false);
    }
  }

  const fieldError = (name: string) => error?.fieldError(name);
  const SHOWN = ["name", "website", "email", "phone", "founded_year", "description"];
  const generalError =
    error && !SHOWN.some((f) => fieldError(f)) ? error.detail : null;

  if (!authLoading && user && !user.roles.includes("employer") && !user.roles.includes("administrator")) {
    return (
      <RoleShell role="employer">
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-slate-900">Employers only</h1>
          <p className="mt-2 text-slate-500">This page needs an employer account.</p>
        </main>
      </RoleShell>
    );
  }

  return (
    <RoleShell role="employer">

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Company Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          {company
            ? "This is what candidates see on your company page."
            : "Set up your company before posting jobs."}
        </p>

        {!loaded ? (
          <div className="flex items-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {/* Status strip — an employer needs to know whether they are listed. */}
            {company && (
              <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    company.is_listed
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {company.is_listed ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                  {company.is_listed ? "Listed publicly" : "Awaiting review"}
                </span>

                {company.is_verified && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                    <BadgeCheck size={14} /> Verified
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Briefcase size={13} className="text-slate-400" />
                  {company.published_jobs_count} live of {company.jobs_count} jobs
                </span>

                {company.is_listed && (
                  <Link
                    href={`/companies/${company.slug}`}
                    target="_blank"
                    className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
                  >
                    View public page <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            )}

            {!company && (
              <p className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                New company profiles are reviewed before they appear in the
                public directory. You can post jobs straight away.
              </p>
            )}

            <form onSubmit={submit} className="mt-6 space-y-6" noValidate>
              {generalError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {generalError}
                </div>
              )}

              {saved && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Company profile saved.
                </div>
              )}

              <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
                <h2 className="font-semibold text-slate-900">The company</h2>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Name <span className="text-red-500">*</span>
                  </span>
                  <input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. PetroEnergy Solutions"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                  />
                  {fieldError("name") && (
                    <span className="mt-1 block text-xs text-red-600">{fieldError("name")}</span>
                  )}
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">About</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={5}
                    placeholder="What the company does, where it operates, what it is like to work there."
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Industry</span>
                    <select
                      value={form.industry_id}
                      onChange={(e) => set("industry_id", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    >
                      <option value="">Choose…</option>
                      {industries.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Company size</span>
                    <select
                      value={form.company_size}
                      onChange={(e) => set("company_size", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    >
                      <option value="">Choose…</option>
                      {SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s} employees
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Founded</span>
                    <input
                      type="number"
                      value={form.founded_year}
                      onChange={(e) => set("founded_year", e.target.value)}
                      placeholder="e.g. 1998"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    />
                    {fieldError("founded_year") && (
                      <span className="mt-1 block text-xs text-red-600">
                        {fieldError("founded_year")}
                      </span>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Website</span>
                    <input
                      value={form.website}
                      onChange={(e) => set("website", e.target.value)}
                      placeholder="https://example.com"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    />
                    {fieldError("website") && (
                      <span className="mt-1 block text-xs text-red-600">
                        {fieldError("website")}
                      </span>
                    )}
                  </label>
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
                <h2 className="font-semibold text-slate-900">Where you are</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Country</span>
                    <select
                      value={form.country_id}
                      onChange={(e) => {
                        set("country_id", e.target.value);
                        set("city_id", "");
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    >
                      <option value="">Choose…</option>
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">City</span>
                    <select
                      value={form.city_id}
                      onChange={(e) => set("city_id", e.target.value)}
                      disabled={!form.country_id}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none disabled:bg-slate-50"
                    >
                      <option value="">
                        {form.country_id ? "Choose…" : "Pick a country first"}
                      </option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Address</span>
                  <input
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </label>
              </section>

              <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
                <h2 className="font-semibold text-slate-900">Contact</h2>
                {/* Kept off the public company page — candidates reach an
                    employer through a job's apply route, not a scraped list. */}
                <p className="-mt-2 text-xs text-slate-400">
                  For our records and your account. Not shown on your public page.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Email</span>
                    <input
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    />
                    {fieldError("email") && (
                      <span className="mt-1 block text-xs text-red-600">{fieldError("email")}</span>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Phone</span>
                    <input
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    />
                  </label>
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving || form.name.trim() === ""}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {company ? "Save changes" : "Create company profile"}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </RoleShell>
  );
}
