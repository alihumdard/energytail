"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  ImageIcon,
  Loader2,
  Save,
  Upload,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { employerCompany, publicApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { EmployerCompany, TaxonomyItem } from "@/lib/api/types";
import RoleShell from "@/components/RoleShell";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { resolveUpload } from "@/lib/thumbnails";

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

  /*
   * Kept out of `form`: a File cannot be serialised with the rest of the
   * payload, and its presence is what decides whether the request goes as
   * JSON or as multipart.
   */
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  /*
   * A local URL for the chosen file, so the preview shows the new pick
   * rather than the logo it is about to replace. Revoked on cleanup — an
   * object URL holds the file in memory until released, and picking
   * several in a row would leak every one of them.
   */
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!logoFile) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(logoFile);
    setObjectUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

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

      /*
       * Multipart only when there is a file to send or one to clear —
       * otherwise the plain JSON body keeps nulls as nulls. FormData
       * stringifies everything, so null would arrive as "null".
       */
      const useForm = logoFile !== null || removeLogo;
      let body: Record<string, unknown> | FormData = payload;

      if (useForm) {
        const data = new FormData();

        for (const [key, value] of Object.entries(payload)) {
          // Skipped rather than sent as "null": a FormData value is always
          // a string, and "null" is not what the API reads as empty.
          if (value !== null && value !== undefined) {
            data.append(key, String(value));
          }
        }

        if (logoFile) data.append("logo", logoFile);
        // "1"/"0", never a JS boolean: false would arrive as the non-empty
        // string "false", which Laravel's boolean rule reads as true.
        if (removeLogo && !logoFile) data.append("remove_logo", "1");

        body = data;
      }

      const { data } = company
        ? await employerCompany.update(company.id, body)
        : await employerCompany.create(body);

      setCompany(data);
      setSaved(true);
      // The saved profile is now the source of truth for the preview.
      setLogoFile(null);
      setRemoveLogo(false);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "Could not reach the server."));
    } finally {
      setSaving(false);
    }
  }

  const fieldError = (name: string) => error?.fieldError(name);

  /** The newly picked file, or the saved logo when nothing is pending. */
  const logoPreview =
    objectUrl ??
    (!removeLogo && company?.logo_path
      ? resolveUpload(company.logo_path)
      : null);
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

                {/*
                  The logo, above the description: it is the first thing a
                  candidate sees on a company card, and a profile without
                  one falls back to the company's initials.
                */}
                <div>
                  <span className="text-sm font-medium text-slate-700">
                    Company logo
                  </span>

                  <div className="mt-1.5 flex flex-wrap items-center gap-4">
                    {/* Square, because that is the shape every card and
                        job listing renders it in. */}
                    <span className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt=""
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <span className="flex flex-col items-center gap-1 text-slate-400">
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-[11px]">No logo</span>
                        </span>
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600">
                        <Upload className="h-4 w-4" />
                        {logoPreview ? "Replace logo" : "Upload logo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;

                            setLogoFile(file);
                            // Picking a file overrides a pending removal:
                            // the two together would delete what was just
                            // uploaded.
                            if (file) setRemoveLogo(false);
                          }}
                        />
                      </label>

                      {logoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoFile(null);
                            // Only a saved logo needs removing on the
                            // server; an unsaved pick is just discarded.
                            setRemoveLogo(Boolean(company?.logo_path));
                          }}
                          className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
                        >
                          Remove
                        </button>
                      )}

                      <p className="mt-2 text-xs text-slate-400">
                        Optional. JPG, PNG or WebP, up to 4MB. A square
                        image works best. Without one, your company shows
                        its initials.
                      </p>

                      {fieldError("logo") && (
                        <p className="mt-1 text-xs text-red-600">
                          {fieldError("logo")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

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
                  {/*
                    Divs, not labels: a <label> forwards a click anywhere
                    inside it to its control, which reopens a custom
                    dropdown the instant it closes.
                  */}
                  <div>
                    <span className="text-sm font-medium text-slate-700">Industry</span>
                    <div className="mt-1">
                      <SearchableSelect
                        options={industries.map((i) => ({
                          value: i.id,
                          label: i.name,
                        }))}
                        value={form.industry_id || null}
                        onChange={(next) =>
                          set("industry_id", next === null ? "" : String(next))
                        }
                        placeholder="Choose…"
                        clearable
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-slate-700">Company size</span>
                    <div className="mt-1">
                      <SearchableSelect
                        options={SIZES.map((size) => ({
                          value: size,
                          label: `${size} employees`,
                        }))}
                        value={form.company_size || null}
                        onChange={(next) =>
                          set("company_size", next === null ? "" : String(next))
                        }
                        placeholder="Choose…"
                        clearable
                      />
                    </div>
                  </div>

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
                  <div>
                    <span className="text-sm font-medium text-slate-700">Country</span>
                    <div className="mt-1">
                      <SearchableSelect
                        options={countries.map((c) => ({
                          value: c.id,
                          label: c.name,
                        }))}
                        value={form.country_id || null}
                        onChange={(next) => {
                          set("country_id", next === null ? "" : String(next));
                          // The old city belongs to the old country.
                          set("city_id", "");
                        }}
                        placeholder="Search countries…"
                        clearable
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-slate-700">City</span>
                    <div className="mt-1">
                      <SearchableSelect
                        options={cities.map((c) => ({
                          value: c.id,
                          label: c.name,
                        }))}
                        value={form.city_id || null}
                        onChange={(next) =>
                          set("city_id", next === null ? "" : String(next))
                        }
                        disabled={!form.country_id}
                        placeholder={
                          form.country_id
                            ? "Search cities…"
                            : "Pick a country first"
                        }
                        clearable
                      />
                    </div>
                  </div>
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
