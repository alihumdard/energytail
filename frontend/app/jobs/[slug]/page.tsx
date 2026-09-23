import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Eye,
  Globe,
  MapPin,
  Wallet,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { DarkFooter } from "@/components/Shared";
import JobCard from "@/components/jobs/JobCard";
import ApplyButton from "@/components/jobs/ApplyButton";
import SaveJobButton from "@/components/jobs/SaveJobButton";
import { SavedJobsProvider } from "@/components/jobs/SavedJobsProvider";
import { fetchPublic, ServerFetchError } from "@/lib/api/server";
import { toNumber } from "@/lib/money";
import { jobThumbnail } from "@/lib/thumbnails";
import JsonLd from "@/lib/seo/JsonLd";
import { jobPostingSchema } from "@/lib/seo/jobPosting";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import type { JobDetail, JobSummary } from "@/lib/api/types";

/** Fetches a job, turning a 404 from the API into a Next.js not-found. */
async function getJob(slug: string): Promise<JobDetail | null> {
  try {
    const { data } = await fetchPublic<{ data: JobDetail }>(`/jobs/${slug}`);

    return data;
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) return null;

    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);

  if (!job) return { title: "Job not found" };

  const where = [job.city?.name, job.country?.name].filter(Boolean).join(", ");
  const title = `${job.meta_title ?? job.title}${
    job.company ? ` at ${job.company.name}` : ""
  }`;

  return {
    title,
    description:
      job.meta_description ??
      `${job.title}${where ? ` in ${where}` : ""}. Apply through Energy Tail.`,
    // Open Graph and canonical URLs are both named in the plan's SEO section.
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: {
      title,
      description: job.meta_description ?? undefined,
      type: "article",
    },
  };
}

function humanise(value: string | null): string | null {
  if (!value) return null;

  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Renders a long text field.
 *
 * The seeded content is plain text with line breaks rather than HTML, so it
 * is split into paragraphs here — rendering it raw would collapse into one
 * block, and dangerouslySetInnerHTML on employer-supplied text would be an
 * injection route.
 */
function Prose({ text }: { text: string | null }) {
  if (!text) return null;

  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-600">
      {text
        .split(/\n{2,}|\r\n\r\n/)
        .filter((block) => block.trim())
        .map((block, i) => (
          <p key={i} className="whitespace-pre-line">
            {block.trim()}
          </p>
        ))}
    </div>
  );
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJob(slug);

  if (!job) notFound();

  const related = await fetchPublic<{ data: JobSummary[] }>(
    `/jobs/${slug}/related`,
  )
    .then((r) => r.data)
    .catch(() => []);

  const location =
    job.location_label ??
    [job.city?.name, job.country?.name].filter(Boolean).join(", ");

  const salaryMin = toNumber(job.salary?.min);
  const salaryMax = toNumber(job.salary?.max);

  const salary = job.salary
    ? [
        salaryMin !== null ? Math.round(salaryMin).toLocaleString() : null,
        salaryMax !== null ? Math.round(salaryMax).toLocaleString() : null,
      ]
        .filter(Boolean)
        .join(" – ")
    : null;

  return (
    <>
      {/*
        Structured data. JobPosting is what makes this listing eligible for
        the Google Jobs box; the breadcrumb renders the trail above the
        result instead of a bare URL.
      */}
      <JsonLd data={jobPostingSchema(job)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Jobs", path: "/jobs" },
          { name: job.title, path: `/jobs/${job.slug}` },
        ])}
      />

      <SiteHeader active="Jobs" />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <nav className="mb-4 text-sm text-slate-400">
          <Link href="/jobs" className="hover:text-blue-600">
            Jobs
          </Link>
          <span className="mx-2">›</span>
          <span className="text-slate-600">{job.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
              {/*
                A banner above the title, matching the thumbnail the card on
                the listing showed — so arriving here looks like following
                the card you clicked rather than landing on a different site.
              */}
              <div className="relative h-40 bg-slate-100 sm:h-52">
                <img
                  src={jobThumbnail(job.category?.slug ?? null, job.slug)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {/* Scrim: the badges below sit close to the image edge, and
                    a photo's own contrast cannot be relied on. */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />

                {job.company && (
                  <span className="absolute bottom-3 left-4 flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur">
                    {job.company.name}
                    {job.company.is_verified && (
                      <BadgeCheck className="h-4 w-4 text-blue-500" />
                    )}
                  </span>
                )}
              </div>

              <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                {job.is_featured && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                    Featured
                  </span>
                )}
                {job.is_urgent && (
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                    Urgent
                  </span>
                )}
                {job.is_remote && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                    Remote
                  </span>
                )}
              </div>

              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                {job.title}
              </h1>

              {job.company && (
                <p className="mt-1 flex items-center gap-1.5 text-slate-600">
                  <Link
                    href={`/companies/${job.company.slug}`}
                    className="font-medium hover:text-blue-600"
                  >
                    {job.company.name}
                  </Link>
                  {job.company.is_verified && (
                    <BadgeCheck className="h-4 w-4 text-blue-500" />
                  )}
                </p>
              )}

              <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-50 pt-4 text-sm sm:grid-cols-2">
                {location && (
                  <Fact icon={MapPin} label="Location" value={location} />
                )}
                {job.employment_type && (
                  <Fact
                    icon={Briefcase}
                    label="Employment"
                    value={humanise(job.employment_type)!}
                  />
                )}
                {salary && (
                  <Fact
                    icon={Wallet}
                    label="Salary"
                    value={`${job.salary?.currency ?? ""}${salary}${
                      job.salary?.period ? ` / ${job.salary.period}` : ""
                    }`}
                  />
                )}
                {job.deadline_at && (
                  <Fact
                    icon={CalendarClock}
                    label="Apply before"
                    value={new Date(job.deadline_at).toLocaleDateString(
                      undefined,
                      {
                        dateStyle: "medium",
                      },
                    )}
                  />
                )}
              </dl>
              </div>
            </div>

            <Section title="Job Description" text={job.description} />
            <Section title="Responsibilities" text={job.responsibilities} />
            <Section title="Requirements" text={job.requirements} />
            <Section title="Benefits" text={job.benefits} />

            {job.skills.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6">
                <h2 className="font-semibold text-slate-900">Skills</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/jobs?skill=${s.slug}`}
                      className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <ApplyButton slug={job.slug} method={job.apply_method} />

              {/* Full-width beneath Apply: the secondary action, not a rival. */}
              <div className="mt-2 grid">
                <SaveJobButton jobId={job.id} variant="full" />
              </div>

              <dl className="mt-4 space-y-2 border-t border-slate-50 pt-4 text-sm">
                {job.reference && (
                  <Row label="Reference" value={job.reference} mono />
                )}
                {job.category && (
                  <Row label="Category" value={job.category.name} />
                )}
                {job.industry && (
                  <Row label="Industry" value={job.industry.name} />
                )}
                <Row
                  label="Views"
                  value={job.views_count.toLocaleString()}
                  icon={Eye}
                />
              </dl>
            </div>

            {job.company && job.company_profile && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5">
                <h2 className="font-semibold text-slate-900">
                  About the company
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {job.company.name}
                </p>

                {job.company_profile.description && (
                  <p className="mt-2 line-clamp-4 text-sm text-slate-500">
                    {job.company_profile.description}
                  </p>
                )}

                {job.company_profile.website && (
                  <a
                    href={job.company_profile.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Visit website
                  </a>
                )}

                <Link
                  href={`/companies/${job.company.slug}`}
                  className="mt-3 block text-sm font-medium text-blue-600 hover:underline"
                >
                  See all jobs from this company
                </Link>
              </div>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Similar Jobs
            </h2>
            {/* Its own provider, so the strip resolves in one request too. */}
            <SavedJobsProvider>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {related.map((r) => (
                  <JobCard key={r.id} job={r} />
                ))}
              </div>
            </SavedJobsProvider>
          </section>
        )}
      </main>

      <DarkFooter />
    </>
  );
}

function Section({ title, text }: { title: string; text: string | null }) {
  if (!text) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6">
      <h2 className="mb-3 font-semibold text-slate-900">{title}</h2>
      <Prose text={text} />
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <dt className="text-xs text-slate-400">{label}</dt>
        <dd className="truncate font-medium text-slate-700">{value}</dd>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: typeof Eye;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd
        className={`truncate text-slate-800 ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
