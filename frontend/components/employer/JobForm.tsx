"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Image as ImageIcon, Loader2, Save, Send, Upload } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { adminCompanies, employerJobs, publicApi } from "@/lib/api/endpoints";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { resolveUpload } from "@/lib/thumbnails";
import type { EmployerJob, TaxonomyItem } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
];

const SALARY_PERIODS = ["hour", "day", "month", "year"];

/**
 * Maps a saved job onto the form's string-keyed state.
 *
 * Every value becomes a string because that is what an <input> holds; the
 * submit path converts them back. Nulls become "" so a cleared optional field
 * is omitted rather than sent as "null".
 */
function initialForm(job?: EmployerJob): Record<string, unknown> {
  if (!job) return {};

  const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));

  return {
    company_id: text(job.company?.id),
    title: text(job.title),
    description: text(job.description),
    responsibilities: text(job.responsibilities),
    requirements: text(job.requirements),
    benefits: text(job.benefits),
    job_category_id: text(job.job_category_id),
    industry_id: text(job.industry_id),
    country_id: text(job.country_id),
    city_id: text(job.city_id),
    location_label: text(job.location_label),
    employment_type: job.employment_type ?? "full_time",
    is_remote: Boolean(job.is_remote),
    experience_min: text(job.experience_min),
    experience_max: text(job.experience_max),
    salary_min: text(job.salary_min),
    salary_max: text(job.salary_max),
    salary_currency: job.salary_currency ?? "USD",
    salary_period: job.salary_period ?? "year",
    salary_is_hidden: Boolean(job.salary_is_hidden),
    apply_method: job.apply_method ?? "external_url",
    apply_url: text(job.apply_url),
    apply_email: text(job.apply_email),
    // <input type="date"> wants YYYY-MM-DD, not the ISO timestamp the API returns.
    deadline_at: job.deadline_at ? job.deadline_at.slice(0, 10) : "",
  };
}

/**
 * The job form, shared by posting and editing.
 *
 * One component rather than two near-identical 700-line pages: the fields and
 * their validation are the same either way, and a rule fixed on one screen
 * but not the other is exactly the kind of drift that produces a listing the
 * API rejects for reasons the form never showed.
 */
export default function JobForm({
  job,
  onSaved,
}: {
  /** The job being edited; omitted when posting a new one. */
  job?: EmployerJob;
  /** Called with the saved job's title and status. */
  onSaved: (result: { title: string; status: string }) => void;
}) {
  const { hasRole } = useAuth();

  /*
   * Only an administrator picks the company. An employer's is implied by who
   * they are, and the API refuses company_id from them precisely so it cannot
   * be used to post under someone else's name.
   */
  const isAdmin = hasRole("administrator");

  const [form, setForm] = useState(() => ({
    company_id: "",
    title: "",
    description: "",
    responsibilities: "",
    requirements: "",
    benefits: "",
    job_category_id: "",
    industry_id: "",
    country_id: "",
    city_id: "",
    location_label: "",
    employment_type: "full_time",
    is_remote: false,
    experience_min: "",
    experience_max: "",
    salary_min: "",
    salary_max: "",
    salary_currency: "USD",
    salary_period: "year",
    salary_is_hidden: false,
    apply_method: "external_url",
    apply_url: "",
    apply_email: "",
    deadline_at: "",
    ...initialForm(job),
  }));

  const [companies, setCompanies] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [industries, setIndustries] = useState<TaxonomyItem[]>([]);
  const [countries, setCountries] = useState<TaxonomyItem[]>([]);

  /**
   * The chosen image, and whether an existing one is being cleared.
   *
   * Kept outside `form` because a File is not a string and must not be
   * serialised with the rest of the payload — it decides whether the
   * request goes as JSON or as multipart.
   */
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  /**
   * A local URL for the chosen file, so the preview shows the new pick
   * rather than the image it is about to replace.
   *
   * Created in an effect and revoked on cleanup: an object URL holds the
   * file in memory until it is released, and picking several images in a
   * row would leak every one of them.
   */
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setObjectUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const [submitting, setSubmitting] = useState<"draft" | "publish" | null>(
    null,
  );
  const [error, setError] = useState<ApiError | null>(null);

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  /*
   * Administrators own no company of their own, so posting on an employer's
   * behalf means naming one. Loaded only for them: the endpoint is admin-only
   * and would 403 for an employer.
   */
  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;

    adminCompanies
      .list({ per_page: 200 })
      .then(({ data }) => {
        if (!cancelled)
          setCompanies(data.map((c) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  // Dropdown options come from the same taxonomy the admin panel manages.
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      publicApi.jobCategories(),
      publicApi.industries(),
      publicApi.countries(),
    ])
      .then(([cats, inds, ctys]) => {
        if (cancelled) return;
        setCategories(cats.data);
        setIndustries(inds.data);
        setCountries(ctys.data);
      })
      .catch(() => {
        // The selects stay empty; the API rejects a missing category anyway,
        // so this cannot produce a silently invalid job.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Cities depend on the chosen country, so they load once one is picked.
   *
   * The result is stored with the country it belongs to, and the render below
   * ignores it when the two disagree. Clearing the list from an effect
   * instead would be a cascading render, and would briefly show the previous
   * country's cities.
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
        if (!cancelled)
          setLoadedCities({ countryId: form.country_id, items: data });
      })
      .catch(() => {
        if (!cancelled)
          setLoadedCities({ countryId: form.country_id, items: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [form.country_id]);

  const cities =
    loadedCities.countryId === form.country_id ? loadedCities.items : [];

  /**
   * The JSON payload as multipart, for a request carrying a file.
   *
   * Booleans are written as "1"/"0" rather than let through String(): a
   * bare "false" is a non-empty string, which Laravel's boolean rule reads
   * as true — so "remote: no" would arrive as yes.
   *
   * Arrays are sent as name[] entries, which is how PHP reconstructs a
   * list; a single append of a joined string would arrive as one value.
   */
  function toFormData(
    payload: Record<string, unknown>,
    file: File | null,
    clearImage: boolean,
  ): FormData {
    const data = new FormData();

    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null) continue;

      if (typeof value === "boolean") {
        data.append(key, value ? "1" : "0");
      } else if (Array.isArray(value)) {
        for (const item of value) data.append(`${key}[]`, String(item));
      } else {
        data.append(key, String(value));
      }
    }

    if (file) data.append("featured_image", file);
    // Only meaningful without a replacement: a new file supersedes it.
    if (clearImage && !file) data.append("remove_featured_image", "1");

    return data;
  }

  async function submit(event: FormEvent, status: "draft" | "published") {
    event.preventDefault();
    setSubmitting(status === "draft" ? "draft" : "publish");
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        job_category_id: Number(form.job_category_id) || undefined,
        country_id: Number(form.country_id) || undefined,
        employment_type: form.employment_type,
        is_remote: form.is_remote,
        apply_method: form.apply_method,
        salary_is_hidden: form.salary_is_hidden,
      };

      /*
       * Status is only sent when creating. On edit the API drops it from the
       * rules and keeps the job's existing state, so an edit cannot quietly
       * publish a draft or resurrect a closed listing.
       */
      if (!job) payload.status = status;

      // The API excludes this field for everyone else, so sending it from an
      // employer would simply be ignored — but there is no reason to.
      if (isAdmin && form.company_id) {
        payload.company_id = Number(form.company_id);
      }

      // Optional fields are omitted when blank rather than sent as "", which
      // the API's numeric and url rules reject.
      const optional: [string, string][] = [
        ["responsibilities", form.responsibilities],
        ["requirements", form.requirements],
        ["benefits", form.benefits],
        ["industry_id", form.industry_id],
        ["city_id", form.city_id],
        ["location_label", form.location_label],
        ["experience_min", form.experience_min],
        ["experience_max", form.experience_max],
        ["salary_min", form.salary_min],
        ["salary_max", form.salary_max],
        ["salary_currency", form.salary_currency],
        ["salary_period", form.salary_period],
        ["deadline_at", form.deadline_at],
        [
          form.apply_method === "external_url" ? "apply_url" : "apply_email",
          form.apply_method === "external_url"
            ? form.apply_url
            : form.apply_email,
        ],
      ];

      for (const [key, value] of optional) {
        if (value !== "") {
          payload[key] =
            key.endsWith("_id") ||
            key.startsWith("experience") ||
            key.startsWith("salary_m")
              ? Number(value)
              : value;
        }
      }

      /*
       * A file cannot travel as JSON, so the whole payload becomes
       * multipart the moment one is attached. Everything else still goes as
       * JSON, which keeps the common case — an edit that does not touch the
       * picture — exactly as it was.
       */
      const body =
        imageFile || removeImage ? toFormData(payload, imageFile, removeImage) : payload;

      const { data } = job
        ? await employerJobs.update(job.id, body)
        : await employerJobs.create(body);

      onSaved({ title: data.title, status: data.status });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err
          : new ApiError(0, "Could not reach the server."),
      );
      setSubmitting(null);
    }
  }

  /*
   * What the preview shows: the newly picked file, or the saved image
   * while none has been picked and none is being removed.
   */
  const imagePreview =
    objectUrl ??
    (!removeImage && job?.featured_image_path
      ? resolveUpload(job.featured_image_path)
      : null);

  const fieldError = (name: string) => error?.fieldError(name);

  // Anything the API reports against a field this form does not show has to
  // reach the banner, or saving fails with nothing on screen to explain it.
  const SHOWN = [
    "title",
    "description",
    "job_category_id",
    "industry_id",
    "country_id",
    "city_id",
    "employment_type",
    "experience_min",
    "experience_max",
    "salary_min",
    "salary_max",
    "apply_method",
    "apply_url",
    "apply_email",
    "deadline_at",
  ];
  const hasInline = SHOWN.some((f) => fieldError(f));
  const generalError = error && !hasInline ? error.detail : null;

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">
        {job ? "Edit Job" : "Post a Job"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {job
          ? "Changes go live as soon as you save."
          : "Candidates apply on your own site — we send them there and count the click."}
      </p>

      <form
        onSubmit={(e) => submit(e, "published")}
        className="mt-6 space-y-6"
        noValidate
      >
        {generalError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {generalError}
          </div>
        )}

        <Card title="The role">
          {isAdmin && (
            // A div, not a label: a label wrapping this control would
            // forward every click inside it — including clicks on an option
            // in the open list — back to the button that opens it.
            <div className="block">
              <label
                htmlFor="company_id"
                className="text-sm font-medium text-slate-700"
              >
                Company <span className="text-red-500">*</span>
              </label>
              {/* Searchable: this list is loaded 200 at a time, and an
                  administrator picking one employer out of that many by
                  scrolling is the slow path. */}
              <div className="mt-1">
                <SearchableSelect
                  id="company_id"
                  options={companies.map((company) => ({
                    value: company.id,
                    label: company.name,
                  }))}
                  value={form.company_id || null}
                  onChange={(next) =>
                    set("company_id", next === null ? "" : String(next))
                  }
                  placeholder="Choose the company this job is for…"
                  invalid={Boolean(fieldError("company_id"))}
                />
              </div>
              {fieldError("company_id") && (
                <span className="mt-1 block text-xs text-red-600">
                  {fieldError("company_id")}
                </span>
              )}
              <span className="mt-1 block text-xs text-slate-400">
                You are posting on an employer&apos;s behalf, so the listing needs a
                company to belong to.
              </span>
            </div>
          )}

          <Field
            label="Job Title"
            required
            value={form.title}
            onChange={(v) => set("title", v)}
            placeholder="e.g. Senior Drilling Engineer"
            error={fieldError("title")}
          />

          <Area
            label="Description"
            required
            rows={6}
            value={form.description}
            onChange={(v) => set("description", v)}
            placeholder="What the role involves, the project, the team…"
            hint="At least 50 characters."
            error={fieldError("description")}
          />

          {/*
            The listing's image. Optional on purpose: a job without one
            still gets a photograph chosen from its category, which is what
            every listing showed before this field existed.
          */}
          <div>
            <span className="text-sm font-medium text-slate-700">
              Feature image
            </span>

            <div className="mt-1.5 flex flex-wrap items-center gap-4">
              {/* A preview, so the choice can be checked before saving —
                  a filename alone says nothing about what was picked. */}
              <span className="relative grid h-24 w-40 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-slate-400">
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-[11px]">No image</span>
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600">
                  <Upload className="h-4 w-4" />
                  {imagePreview ? "Replace image" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;

                      setImageFile(file);
                      // Choosing a file overrides a pending removal — the
                      // two together would delete the upload just made.
                      if (file) setRemoveImage(false);
                    }}
                  />
                </label>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      // Only an image already saved needs removing on the
                      // server; an unsaved pick is just discarded.
                      setRemoveImage(Boolean(job?.featured_image_path));
                    }}
                    className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
                  >
                    Remove
                  </button>
                )}

                <p className="mt-2 text-xs text-slate-400">
                  JPG, PNG or WebP, up to 4MB. Shown on the job card and at
                  the top of the listing. Leave empty to use a photo from
                  the job&apos;s category.
                </p>

                {fieldError("featured_image") && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldError("featured_image")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Area
            label="Responsibilities"
            rows={4}
            value={form.responsibilities}
            onChange={(v) => set("responsibilities", v)}
          />
          <Area
            label="Requirements"
            rows={4}
            value={form.requirements}
            onChange={(v) => set("requirements", v)}
          />
          <Area
            label="Benefits"
            rows={3}
            value={form.benefits}
            onChange={(v) => set("benefits", v)}
          />
        </Card>

        <Card title="Classification">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              required
              value={form.job_category_id}
              onChange={(v) => set("job_category_id", v)}
              options={categories}
              error={fieldError("job_category_id")}
            />
            <Select
              label="Industry"
              value={form.industry_id}
              onChange={(v) => set("industry_id", v)}
              options={industries}
              error={fieldError("industry_id")}
            />
            <Select
              label="Country"
              required
              value={form.country_id}
              onChange={(v) => {
                set("country_id", v);
                set("city_id", "");
              }}
              options={countries}
              error={fieldError("country_id")}
            />
            <Select
              label="City"
              value={form.city_id}
              onChange={(v) => set("city_id", v)}
              options={cities}
              disabled={!form.country_id}
              error={fieldError("city_id")}
            />
          </div>

          <Field
            label="Location Label"
            value={form.location_label}
            onChange={(v) => set("location_label", v)}
            placeholder="e.g. Offshore — North Sea"
            hint="Shown instead of city and country when set."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Employment Type</Label>
              <select
                value={form.employment_type}
                onChange={(e) => set("employment_type", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-end gap-2 pb-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.is_remote}
                onChange={(e) => set("is_remote", e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              This role is remote
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Minimum Experience (years)"
              type="number"
              value={form.experience_min}
              onChange={(v) => set("experience_min", v)}
              error={fieldError("experience_min")}
            />
            <Field
              label="Maximum Experience (years)"
              type="number"
              value={form.experience_max}
              onChange={(v) => set("experience_max", v)}
              error={fieldError("experience_max")}
            />
          </div>
        </Card>

        <Card title="Salary">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Field
              label="Minimum"
              type="number"
              value={form.salary_min}
              onChange={(v) => set("salary_min", v)}
              error={fieldError("salary_min")}
            />
            <Field
              label="Maximum"
              type="number"
              value={form.salary_max}
              onChange={(v) => set("salary_max", v)}
              error={fieldError("salary_max")}
            />
            <Field
              label="Currency"
              value={form.salary_currency}
              onChange={(v) => set("salary_currency", v.toUpperCase())}
              placeholder="USD"
            />
            <div>
              <Label>Per</Label>
              <select
                value={form.salary_period}
                onChange={(e) => set("salary_period", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {SALARY_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.salary_is_hidden}
              onChange={(e) => set("salary_is_hidden", e.target.checked)}
              className="rounded border-slate-300 text-blue-600"
            />
            Do not show the salary publicly
          </label>
        </Card>

        <Card title="How to apply">
          <p className="-mt-2 text-xs text-slate-500">
            Applications are handled by you. We record the click and send the
            candidate straight to your own page or inbox.
          </p>

          <div className="flex gap-4">
            {[
              { value: "external_url", label: "On my website" },
              { value: "email", label: "By email" },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-sm text-slate-600"
              >
                <input
                  type="radio"
                  name="apply_method"
                  checked={form.apply_method === option.value}
                  onChange={() => set("apply_method", option.value)}
                  className="text-blue-600"
                />
                {option.label}
              </label>
            ))}
          </div>

          {form.apply_method === "external_url" ? (
            <Field
              label="Application URL"
              required
              type="url"
              value={form.apply_url}
              onChange={(v) => set("apply_url", v)}
              placeholder="https://yourcompany.com/careers/123"
              error={fieldError("apply_url")}
            />
          ) : (
            <Field
              label="Application Email"
              required
              type="email"
              value={form.apply_email}
              onChange={(v) => set("apply_email", v)}
              placeholder="careers@yourcompany.com"
              error={fieldError("apply_email")}
            />
          )}

          <Field
            label="Closing Date"
            type="date"
            value={form.deadline_at}
            onChange={(v) => set("deadline_at", v)}
            hint="Leave blank to use the default listing period."
            error={fieldError("deadline_at")}
          />
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          {job ? (
            <button
              type="submit"
              disabled={submitting !== null}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting !== null ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => submit(e, "draft")}
                disabled={submitting !== null}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                {submitting === "draft" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save as draft
              </button>

              <button
                type="submit"
                disabled={submitting !== null}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting === "publish" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Publish job
              </button>
            </>
          )}
        </div>
      </form>
    </>
  );
}
/* ------------------------------------------------------------ form pieces */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-slate-700">{children}</span>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");

  return (
    <div>
      <label htmlFor={id}>
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 4,
  required = false,
  placeholder,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");

  return (
    <div>
      <label htmlFor={id}>
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: TaxonomyItem[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");

  return (
    <div>
      <label htmlFor={id}>
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      </label>
      {/*
        Searchable rather than native. The country list runs to 193 and the
        categories to 62, and finding one by scrolling — or by typing blind
        against a native select's first-letter matching — was the slowest
        part of posting a job.
      */}
      <div className="mt-1">
        <SearchableSelect
          id={id}
          options={options.map((o) => ({
            value: o.id,
            label: o.name,
            // Countries carry a flag and a code; the code is searchable
            // too, so "AE" finds the United Arab Emirates.
            prefix: o.flag_emoji ?? undefined,
            hint: o.code ?? o.region ?? undefined,
          }))}
          value={value || null}
          onChange={(next) => onChange(next === null ? "" : String(next))}
          disabled={disabled}
          invalid={Boolean(error)}
          placeholder={
            disabled ? "Choose a country first" : `Select ${label.toLowerCase()}…`
          }
          clearable={!required}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
