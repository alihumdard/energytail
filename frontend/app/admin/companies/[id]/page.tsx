"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Star,
  XCircle,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { ApiError } from "@/lib/api/client";
import { adminCompanies } from "@/lib/api/endpoints";
import type { AdminCompany } from "@/lib/api/types";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-blue-50 text-blue-700",
  suspended: "bg-red-50 text-red-700",
  inactive: "bg-slate-100 text-slate-600",
};

function humanise(value: string | null): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [company, setCompany] = useState<AdminCompany | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let cancelled = false;

    adminCompanies
      .get(Number(id))
      .then(({ data }) => {
        if (!cancelled) setCompany(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError ? err.detail : "Could not load the company.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function run(work: () => Promise<{ data: AdminCompany }>) {
    setBusy(true);
    setActionError(null);

    try {
      const { data } = await work();
      setCompany(data);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.detail : "Could not update the company.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell active="companies">
      <Link
        href="/admin/companies"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        All companies
      </Link>

      {loadError ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-500">{loadError}</p>
        </div>
      ) : !company ? (
        <div className="flex items-center gap-2 py-16 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading the company…
        </div>
      ) : (
        <>
          {actionError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {actionError}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="min-w-0 space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-slate-100 text-2xl font-bold text-slate-400">
                      {company.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900">
                        {company.name}
                        {company.is_verified && (
                          <BadgeCheck size={19} className="text-blue-500" />
                        )}
                        {company.is_featured && (
                          <Star
                            size={16}
                            className="fill-amber-400 text-amber-400"
                          />
                        )}
                      </h1>
                      {company.industry && (
                        <p className="mt-0.5 text-sm text-slate-500">
                          {company.industry.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      STATUS_STYLE[company.status] ??
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {humanise(company.status)}
                  </span>
                </div>

                {company.description && (
                  <p className="mt-5 whitespace-pre-line border-t border-slate-100 pt-5 text-sm leading-relaxed text-slate-600">
                    {company.description}
                  </p>
                )}

                <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                  {[
                    ["Owner", company.owner?.name ?? "—"],
                    ["Owner email", company.owner?.email ?? "—"],
                    [
                      "Location",
                      [company.city?.name, company.country?.name]
                        .filter(Boolean)
                        .join(", ") || "—",
                    ],
                    ["Company size", company.company_size ?? "—"],
                    [
                      "Founded",
                      company.founded_year ? String(company.founded_year) : "—",
                    ],
                    ["Registered", formatDate(company.created_at)],
                    ["Verified on", formatDate(company.verified_at)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-slate-400">{label}</dt>
                      <dd className="mt-0.5 truncate text-sm text-slate-700">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Contact details are on the record but never on the public
                      page — a moderator can see them here. */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-3 font-semibold text-slate-900">Contact</h2>
                <div className="space-y-2 text-sm">
                  {company.email ? (
                    <p className="flex items-center gap-2 text-slate-600">
                      <Mail size={14} className="text-slate-400" />
                      {company.email}
                    </p>
                  ) : null}
                  {company.phone ? (
                    <p className="flex items-center gap-2 text-slate-600">
                      <Phone size={14} className="text-slate-400" />
                      {company.phone}
                    </p>
                  ) : null}
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <Globe size={14} />
                      {company.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : null}
                  {company.address ? (
                    <p className="flex items-start gap-2 text-slate-600">
                      <MapPin size={14} className="mt-0.5 text-slate-400" />
                      {company.address}
                    </p>
                  ) : null}
                  {!company.email &&
                    !company.phone &&
                    !company.website &&
                    !company.address && (
                      <p className="text-slate-400">
                        No contact details on file.
                      </p>
                    )}
                </div>
              </div>
            </div>

            {/* Moderation */}
            <aside className="min-w-0 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs text-slate-400">Jobs posted</p>
                <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900">
                  <Briefcase size={18} className="text-slate-400" />
                  {company.jobs_count}
                </p>
                <Link
                  href={`/admin/jobs?company_id=${company.id}`}
                  className="mt-2 inline-block text-xs font-semibold text-blue-600"
                >
                  View their listings
                </Link>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-3 font-semibold text-slate-900">
                  Moderation
                </h2>

                <div className="space-y-2">
                  {company.status !== "active" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(() => adminCompanies.approve(company.id))
                      }
                      className="flex w-full items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} /> Approve
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(() => adminCompanies.toggleVerified(company.id))
                    }
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <BadgeCheck
                      size={15}
                      className={company.is_verified ? "text-blue-500" : ""}
                    />
                    {company.is_verified
                      ? "Remove verification"
                      : "Verify company"}
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(() => adminCompanies.toggleFeatured(company.id))
                    }
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Star
                      size={15}
                      className={
                        company.is_featured
                          ? "fill-amber-400 text-amber-400"
                          : ""
                      }
                    />
                    {company.is_featured ? "Remove feature" : "Feature company"}
                  </button>

                  {company.status !== "suspended" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setSuspending(true)}
                      className="flex w-full items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle size={15} /> Suspend
                    </button>
                  )}
                </div>

                {busy && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin" /> Working…
                  </p>
                )}
              </div>

              {company.status === "active" && (
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <Link
                    href={`/companies/${company.slug}`}
                    target="_blank"
                    className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink size={14} /> View public page
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </>
      )}

      {suspending && company && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Suspend {company.name}?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Their public page comes down and their listings stay on record.
              The reason is written to the audit log.
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why is this company being suspended?"
              className="mt-4 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-400 focus:outline-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSuspending(false);
                  setReason("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reason.trim() === ""}
                onClick={() => {
                  const text = reason;
                  setSuspending(false);
                  setReason("");
                  run(() => adminCompanies.suspend(company.id, text));
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
