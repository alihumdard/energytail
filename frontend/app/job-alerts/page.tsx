"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Bell, BellOff, Loader2, Plus, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { publicApi, seeker } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/useApiResource";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { JobAlert, TaxonomyItem } from "@/lib/api/types";
import RoleShell from "@/components/RoleShell";

const EMPLOYMENT_TYPES = [
  { value: "", label: "Any type" },
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
];

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const EMPTY_FORM = {
  name: "",
  keywords: "",
  job_category_id: "",
  country_id: "",
  employment_type: "",
  is_remote: false,
  frequency: "weekly",
};

export default function JobAlertsPage() {
  const { user, loading: authLoading } = useAuth();

  const [editing, setEditing] = useState<JobAlert | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [countries, setCountries] = useState<TaxonomyItem[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<JobAlert | null>(null);

  const { data, loading, refetch } = useApiResource(() => seeker.alerts(), []);
  const alerts = data?.data ?? [];

  useEffect(() => {
    let cancelled = false;

    Promise.all([publicApi.jobCategories(), publicApi.countries()])
      .then(([cats, ctys]) => {
        if (cancelled) return;
        setCategories(cats.data);
        setCountries(ctys.data);
      })
      .catch(() => {
        // The selects stay empty; every filter here is optional.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(alert: JobAlert) {
    setEditing(alert);
    setForm({
      name: alert.name,
      keywords: alert.keywords ?? "",
      job_category_id: alert.job_category_id ? String(alert.job_category_id) : "",
      country_id: alert.country_id ? String(alert.country_id) : "",
      employment_type: alert.employment_type ?? "",
      is_remote: alert.is_remote,
      frequency: alert.frequency,
    });
    setError(null);
    setShowForm(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        frequency: form.frequency,
        is_remote: form.is_remote,
      };

      // Blank optionals are sent as null so clearing a filter actually clears
      // it, rather than being omitted and silently kept.
      payload.keywords = form.keywords || null;
      payload.job_category_id = form.job_category_id ? Number(form.job_category_id) : null;
      payload.country_id = form.country_id ? Number(form.country_id) : null;
      payload.employment_type = form.employment_type || null;

      if (editing) {
        await seeker.updateAlert(editing.id, payload);
      } else {
        await seeker.createAlert(payload);
      }

      setShowForm(false);
      setEditing(null);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not save the alert.");
    } finally {
      setSaving(false);
    }
  }

  async function run(alert: JobAlert, work: () => Promise<unknown>) {
    setBusyId(alert.id);
    setError(null);

    try {
      await work();
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not update the alert.");
    } finally {
      setBusyId(null);
    }
  }

  if (!authLoading && !user) {
    return (
      <RoleShell role="seeker">
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-slate-900">Sign in to manage your alerts</h1>
          <Link
            href="/login?redirect=/job-alerts"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Sign in
          </Link>
        </main>
      </RoleShell>
    );
  }

  return (
    <RoleShell role="seeker">

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Job Alerts</h1>
            <p className="mt-1 text-sm text-slate-500">
              Save a search and we will email you when matching jobs are posted.
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} /> New Alert
          </button>
        </div>

        {error && !showForm && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white">
          {loading && alerts.length === 0 ? (
            <div className="flex items-center gap-2 p-10 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your alerts…
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="mx-auto h-10 w-10 text-slate-200" />
              <p className="mt-3 text-slate-500">You have no alerts yet.</p>
              <button
                type="button"
                onClick={openNew}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={16} /> Create your first alert
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {alerts.map((a) => (
                <li key={a.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-slate-900">{a.name}</h2>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            a.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {a.is_active ? "Active" : "Paused"}
                        </span>
                      </div>

                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="capitalize">{a.frequency}</span>
                        {a.keywords && <span>&ldquo;{a.keywords}&rdquo;</span>}
                        {a.category && <span>{a.category.name}</span>}
                        {a.country && <span>{a.country.name}</span>}
                        {a.employment_type && (
                          <span className="capitalize">
                            {a.employment_type.replace(/_/g, " ")}
                          </span>
                        )}
                        {a.is_remote && <span>Remote</span>}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {busyId === a.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(a)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            title={a.is_active ? "Pause" : "Resume"}
                            onClick={() => run(a, () => seeker.toggleAlert(a.id))}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100"
                          >
                            {a.is_active ? <BellOff size={15} /> : <Bell size={15} />}
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => setDeleting(a)}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Create / edit dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-4">
          <form
            onSubmit={save}
            className="w-full max-w-lg rounded-xl bg-white p-6"
            noValidate
          >
            <h2 className="text-lg font-bold text-slate-900">
              {editing ? "Edit alert" : "New alert"}
            </h2>

            {error && (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Name <span className="text-red-500">*</span>
                </span>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Remote HSE roles"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Keywords</span>
                <input
                  value={form.keywords}
                  onChange={(e) => set("keywords", e.target.value)}
                  placeholder="e.g. drilling engineer"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Category</span>
                  <select
                    value={form.job_category_id}
                    onChange={(e) => set("job_category_id", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    <option value="">Any category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Country</span>
                  <select
                    value={form.country_id}
                    onChange={(e) => set("country_id", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    <option value="">Anywhere</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Type</span>
                  <select
                    value={form.employment_type}
                    onChange={(e) => set("employment_type", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Email me</span>
                  <select
                    value={form.frequency}
                    onChange={(e) => set("frequency", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_remote}
                  onChange={(e) => set("is_remote", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Remote roles only</span>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || form.name.trim() === ""}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create alert"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Delete this alert?</h2>
            <p className="mt-1 text-sm text-slate-500">
              &ldquo;{deleting.name}&rdquo; will stop emailing you. Pausing keeps
              the search if you might want it back.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const alert = deleting;
                  setDeleting(null);
                  run(alert, () => seeker.deleteAlert(alert.id));
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleShell>
  );
}
