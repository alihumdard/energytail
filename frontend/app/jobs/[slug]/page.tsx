import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
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
              {/*
                Tall enough to read as a photograph rather than a coloured
                strip — h-40 cropped these to a band of sky. Sized by ratio
                so it scales with the column instead of being a fixed height
                that is generous on a phone and mean on a wide screen, and
                capped so it cannot push the title below the fold.
              */}
              <div className="relative aspect-[16/7] max-h-[26rem] min-h-[13rem] bg-slate-100">
                <img
                  src={jobThumbnail(
                    job.category?.slug ?? null,
                    job.slug,
                    job.featured_image_path,
                  )}
                  alt=""
                  className="h-full w-full object-cover"
                />

                {/*
                  The title sits on the image rather than under it. Below, it
                  read as a caption to a photo the reader had already passed;
                  on it, the photo is the header of the thing being named.
                  The scrim is what makes white text safe over a photograph
                  whose own contrast cannot be relied on.
                */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/5" />

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  {(job.is_featured || job.is_urgent || job.is_remote) && (
                    <div className="mb-2.5 flex flex-wrap items-center gap-2">
                      {job.is_featured && (
                        <span className="rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                          Featured
                        </span>
                      )}
                      {job.is_urgent && (
                        <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                          Urgent
                        </span>
                      )}
                      {job.is_remote && (
                        <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                          Remote
                        </span>
                      )}
                    </div>
                  )}

                  <h1 className="text-2xl font-bold leading-tight text-white drop-shadow-sm sm:text-3xl">
                    {job.title}
                  </h1>

                  {/* One company line, not two: it was printed on the image
                      and again directly beneath it. */}
                  {job.company && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-200">
                      <Link
                        href={`/companies/${job.company.slug}`}
                        className="font-semibold transition-colors hover:text-white"
                      >
                        {job.company.name}
                      </Link>
                      {job.company.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-blue-300" />
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6">
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
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
                <h2 className="font-semibold text-slate-900">
                  Skills &amp; Expertise
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tap a skill to see other roles that ask for it.
                </p>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/jobs?skill=${s.slug}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Offset by the header's real height, as the board's filter
              sidebar is. lg:top-4 pinned the apply panel 101px under it. */}
          <aside className="space-y-4 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)]">
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
          /*
            A rule and real space above it. The strip previously began 40px
            below the apply panel with nothing between them, so it read as
            more of the same job rather than a new section — and on a short
            job the two ran together entirely.
          */
          <section className="mt-12 border-t border-slate-200 pt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Similar Jobs
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {job.category
                    ? `More ${job.category.name} roles you may be a fit for.`
                    : "More roles you may be a fit for."}
                </p>
              </div>

              {/* The strip is a sample, so it needs a way through to the
                  rest — filtered to the same category, not just /jobs. */}
              <Link
                href={
                  job.category
                    ? `/jobs?category=${job.category.slug}`
                    : "/jobs"
                }
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600"
              >
                Browse all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Its own provider, so the strip resolves in one request too. */}
            <SavedJobsProvider>
              {/*
                Three across on a desktop, four where there is room for them.
                At two, each card was as wide as the job above it and the
                strip read as a second listing rather than a footnote to
                this one.

                items-stretch so cards in a row match height regardless of
                how much text each carries — ragged card bottoms are what
                made the grid look untidy.
              */}
              <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
      {/* On its own tinted tile: these four facts are the whole body of the
          header card now that the title has moved onto the image, and as
          loose rows they read as a footnote to it. */}
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </dt>
        {/* Wraps: a salary range or a long location was being cut off. */}
        <dd className="mt-0.5 font-semibold leading-snug text-slate-800">
          {value}
        </dd>
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
