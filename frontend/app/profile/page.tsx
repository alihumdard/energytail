"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Save,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { ApiError } from "@/lib/api/client";
import { seekerProfile } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Resume } from "@/lib/api/types";
import ProfessionalDetails from "@/components/seeker/ProfessionalDetails";
import SkillsSection from "@/components/seeker/SkillsSection";
import {
  CertificateSection,
  EducationSection,
  ExperienceSection,
  LanguageSection,
  PortfolioSection,
} from "@/components/seeker/Sections";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();

  /*
   * The form is a child keyed by the user's id, so it seeds itself from the
   * loaded session on mount. Seeding from an effect instead would be a
   * setState-in-effect and would fight every session refresh.
   */
  if (authLoading) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl flex-1 px-4 py-16">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            Sign in to edit your profile
          </h1>
          <Link
            href="/login?redirect=/profile"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Sign in
          </Link>
        </main>
      </>
    );
  }

  return <ProfileEditor key={user.id} />;
}

function ProfileEditor() {
  const { user, refresh } = useAuth();

  /*
   * The CV sections belong to candidates. An employer or author opening this
   * page manages their account here too, and showing them a work-history
   * editor they have no use for would just be noise.
   *
   * This hides the UI; the API is what actually protects the data.
   */
  const isSeeker = user?.roles.includes("job_seeker") ?? false;

  const [form, setForm] = useState(() => ({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    phone: user?.phone ?? "",
  }));

  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    seekerProfile
      .resumes()
      .then(({ data }) => {
        if (!cancelled) setResumes(data);
      })
      .catch(() => {
        if (!cancelled) setResumes([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function reloadResumes() {
    const { data } = await seekerProfile.resumes();
    setResumes(data);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await seekerProfile.update({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || null,
      });

      // The header shows the name, so the session copy has to catch up.
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err
          : new ApiError(0, "Could not reach the server."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function upload(file: File) {
    setUploading(true);
    setUploadError(null);

    try {
      await seekerProfile.uploadResume(file);
      await reloadResumes();
    } catch (err) {
      setUploadError(
        err instanceof ApiError ? err.detail : "Could not upload the file.",
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function run(id: number, work: () => Promise<unknown>) {
    setBusyId(id);
    setUploadError(null);

    try {
      await work();
      await reloadResumes();
    } catch (err) {
      setUploadError(
        err instanceof ApiError ? err.detail : "Could not update the CV.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const fieldError = (name: string) => error?.fieldError(name);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Your Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your details and the CVs you keep on file.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-6" noValidate>
          {error && !fieldError("first_name") && !fieldError("last_name") && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error.detail}
            </div>
          )}

          {saved && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Profile saved.
            </div>
          )}

          <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Your details</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  First name
                </span>
                <input
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                />
                {fieldError("first_name") && (
                  <span className="mt-1 block text-xs text-red-600">
                    {fieldError("first_name")}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Last name
                </span>
                <input
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Phone
                </span>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Email
                </span>
                <input
                  value={user?.email ?? ""}
                  disabled
                  className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                />
                {/* Changing it would move the account to an address nobody has
                    proved they control. */}
                <span className="mt-1 block text-xs text-slate-400">
                  Your email is confirmed and cannot be changed here.
                </span>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </button>
            </div>
          </section>
        </form>

        {/* CVs */}
        <section className="mt-6 space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">Your CVs</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                PDF or Word, up to 5 MB. Kept private — only you can download
                them.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload CV
            </button>

            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
              }}
            />
          </div>

          {uploadError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {uploadError}
            </div>
          )}

          {resumes === null ? (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : resumes.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto h-9 w-9 text-slate-200" />
              <p className="mt-2 text-sm text-slate-500">
                No CVs uploaded yet.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {resumes.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <FileText size={18} className="shrink-0 text-slate-400" />

                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
                      {r.title || r.original_name}
                      {r.is_default && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={11} /> Default
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.original_name} · {formatSize(r.size_bytes)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {busyId === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                      <>
                        {!r.is_default && (
                          <button
                            type="button"
                            title="Make this the default"
                            onClick={() =>
                              run(r.id, () =>
                                seekerProfile.setDefaultResume(r.id),
                              )
                            }
                            className="rounded p-1.5 text-slate-300 hover:bg-slate-100 hover:text-amber-500"
                          >
                            <Star size={16} />
                          </button>
                        )}

                        {/* A direct link, not fetch: the browser handles the
                            download, and the endpoint requires the session
                            cookie it already sends. */}
                        <a
                          href={`${API_URL}/api/v1/seeker/resumes/${r.id}/download`}
                          title="Download"
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100"
                        >
                          <Download size={16} />
                        </a>

                        <button
                          type="button"
                          title="Delete"
                          onClick={() =>
                            run(r.id, () => seekerProfile.deleteResume(r.id))
                          }
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isSeeker && (
          <div className="mt-6 space-y-6">
            <ProfessionalDetails enabled={isSeeker} />
            <ExperienceSection enabled={isSeeker} />
            <EducationSection enabled={isSeeker} />
            <SkillsSection enabled={isSeeker} />
            <CertificateSection enabled={isSeeker} />
            <LanguageSection enabled={isSeeker} />
            <PortfolioSection enabled={isSeeker} />
          </div>
        )}
      </main>
    </>
  );
}
