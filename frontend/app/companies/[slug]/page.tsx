import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Calendar,
  ExternalLink,
  MapPin,
  Users,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { DarkFooter } from "@/components/Shared";
import { fetchPublic, ServerFetchError } from "@/lib/api/server";
import JsonLd from "@/lib/seo/JsonLd";
import { breadcrumbSchema, organizationSchema } from "@/lib/seo/schemas";
import type { CompanyJob, Paginated, PublicCompany } from "@/lib/api/types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function loadCompany(slug: string): Promise<PublicCompany | null> {
  try {
    const { data } = await fetchPublic<{ data: PublicCompany }>(`/companies/${slug}`);
    return data;
  } catch (error) {
    // A missing or suspended company is a 404, not a crash.
    if (error instanceof ServerFetchError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const company = await loadCompany(slug);

  if (!company) return { title: "Company not found" };

  const title = company.meta_title ?? `${company.name} — Careers`;
  const description =
    company.meta_description ??
    company.description?.slice(0, 160) ??
    `Open roles at ${company.name}.`;

  return {
    title,
    description,
    // Without a canonical, ?page= and filter variants compete with this page.
    alternates: { canonical: `/companies/${company.slug}` },
    openGraph: { title, description, type: "profile" },
  };
}

function humanise(value: string | null): string {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;

  const company = await loadCompany(slug);
  if (!company) notFound();

  const jobs = await fetchPublic<Paginated<CompanyJob>>(
    `/companies/${slug}/jobs`,
    { params: { per_page: 20 } },
  ).catch(() => null);

  const openJobs = jobs?.data ?? [];

  return (
    <>
      <JsonLd data={organizationSchema(company)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Companies", path: "/companies" },
          { name: company.name, path: `/companies/${company.slug}` },
        ])}
      />

      <SiteHeader active="Companies" />

      <main className="flex-1 bg-slate-50">
        {/* Header */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <Link
              href="/companies"
              className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              All companies
            </Link>

            <div className="flex flex-wrap items-start gap-5">
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-slate-100 text-3xl font-bold text-slate-400">
                {company.name.charAt(0)}
              </span>

              <div className="min-w-0 flex-1">
                <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {company.name}
                  {company.is_verified && (
                    <BadgeCheck size={22} className="text-blue-500" />
                  )}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  {company.industry && <span>{company.industry.name}</span>}
                  {(company.city || company.country) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      {[company.city?.name, company.country?.name].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {company.company_size && (
                    <span className="inline-flex items-center gap-1">
                      <Users size={13} className="text-slate-400" />
                      {company.company_size}
                    </span>
                  )}
                  {company.founded_year && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={13} className="text-slate-400" />
                      Founded {company.founded_year}
                    </span>
                  )}
                </div>

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Visit website
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 px-5 py-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{company.open_jobs}</p>
                <p className="text-xs text-slate-500">
                  open {company.open_jobs === 1 ? "role" : "roles"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1fr_300px]">
          {/* Open roles */}
          <section className="min-w-0">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Open Roles at {company.name}
            </h2>

            {openJobs.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                <p className="text-slate-500">
                  No open roles right now.
                </p>
                <Link
                  href="/jobs"
                  className="mt-3 inline-block text-sm font-semibold text-blue-600"
                >
                  Browse all jobs
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {openJobs.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/jobs/${job.slug}`}
                      className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900">{job.title}</h3>
                        {job.is_featured && (
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            Featured
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {job.category && <span>{job.category.name}</span>}
                        {job.employment_type && (
                          <span>{humanise(job.employment_type)}</span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} className="text-slate-400" />
                          {job.is_remote
                            ? "Remote"
                            : job.location_label ??
                              [job.city?.name, job.country?.name].filter(Boolean).join(", ") ??
                              "—"}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* About */}
          <aside className="min-w-0 space-y-6">
            {company.description && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-2 font-bold text-slate-900">About</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {company.description}
                </p>
              </div>
            )}

            {(company.address || company.socials?.length) && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-2 font-bold text-slate-900">Details</h2>

                {company.address && (
                  <p className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                    {company.address}
                  </p>
                )}

                {company.socials && company.socials.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {company.socials.map((s) => (
                      <a
                        key={s.platform}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600"
                      >
                        {humanise(s.platform)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-1 flex items-center gap-2 font-bold text-slate-900">
                <Briefcase size={16} className="text-slate-400" />
                Hiring here?
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Applications go to {company.name} directly — Energy Tail sends
                you to their own site or inbox.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <DarkFooter />
    </>
  );
}
