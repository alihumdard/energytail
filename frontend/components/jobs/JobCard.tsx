import Link from "next/link";
import { BadgeCheck, Briefcase, Clock, MapPin, Wallet } from "lucide-react";
import SaveJobButton from "@/components/jobs/SaveJobButton";
import type { JobSummary } from "@/lib/api/types";
import { toNumber } from "@/lib/money";
import { jobThumbnail } from "@/lib/thumbnails";

/** "Full Time" from "full_time". */
function humanise(value: string | null): string | null {
  if (!value) return null;

  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Job titles are free-text employer input, so "drilling engineer" and
 *  "DRILLING ENGINEER" both need to read as "Drilling Engineer". */
function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

/** "2 days ago", from an ISO timestamp. */
function relative(iso: string | null): string | null {
  if (!iso) return null;

  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);

  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/** Normalises the free-text salary period field ("year" and "yearly" both
 *  appear in real data) to one consistent label. */
function periodLabel(period: string | null): string {
  if (!period) return "";

  const normalised = period.toLowerCase().replace(/ly$/, "");
  const known = ["year", "month", "week", "day", "hour"];

  return known.includes(normalised) ? `/ ${normalised}` : `/ ${period}`;
}

/**
 * Salary as a line of text, or null when the employer withheld it.
 *
 * The API already returns null in that case, so there is no bound here to
 * leak — this only has to render what it is given.
 */
function salaryLabel(job: JobSummary): string | null {
  if (!job.salary) return null;

  const { currency, period } = job.salary;
  // Parsed rather than used raw: these are decimal strings off the API.
  const min = toNumber(job.salary.min);
  const max = toNumber(job.salary.max);
  const money = (n: number) =>
    `${currency ? `${currency} ` : ""}${Math.round(n).toLocaleString()}`;

  const range =
    min !== null && max !== null
      ? `${money(min)} – ${money(max)}`
      : min !== null
        ? `From ${money(min)}`
        : max !== null
          ? `Up to ${money(max)}`
          : null;

  if (!range) return null;

  const periodText = periodLabel(period);

  return periodText ? `${range} ${periodText}` : range;
}

function experienceLabel(job: JobSummary): string | null {
  const { experience_min: min, experience_max: max } = job;

  if (min === null && max === null) return null;
  if (min !== null && max !== null) return `${min}–${max} yrs`;

  return min !== null ? `${min}+ yrs` : `Up to ${max} yrs`;
}

export default function JobCard({ job }: { job: JobSummary }) {
  const location =
    job.location_label ??
    [job.city?.name, job.country?.name].filter(Boolean).join(", ");

  const salary = salaryLabel(job);
  const experience = experienceLabel(job);
  const posted = relative(job.published_at);
  const thumbnail = jobThumbnail(job.category?.slug ?? null, job.slug);

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        job.is_featured
          ? "border-blue-200 ring-1 ring-blue-100"
          : "border-slate-100"
      }`}
    >
      {/* The whole card links to the job; the bookmark and "View job" links
          sit above it with their own stopPropagation-free stacking, since
          nested interactive elements inside an <a> are invalid HTML — this
          overlay approach keeps the card clickable without nesting links. */}
      <Link
        href={`/jobs/${job.slug}`}
        className="absolute inset-0 z-0 rounded-2xl"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="p-4 sm:p-5">
        {/*
          A post header, the way a feed card opens: who posted, and when.
          The job title leads the body below it. Laid out this way rather
          than beside a tall photo, which pushed the title into a narrow
          column and made the picture the loudest thing on the card.
        */}
        <div className="flex items-start gap-3">
          <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-sm font-bold text-slate-500">
            {(job.company?.name ?? "?").slice(0, 2).toUpperCase()}
          </span>

          <div className="min-w-0 flex-1">
            {/* Company and timestamp: the "posted by" line of a feed post. */}
            <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
              {job.company ? (
                <Link
                  href={`/companies/${job.company.slug}`}
                  className="relative z-10 font-semibold text-slate-700 hover:text-blue-600"
                >
                  {job.company.name}
                </Link>
              ) : (
                <span className="font-semibold text-slate-400">
                  Company withheld
                </span>
              )}
              {job.company?.is_verified && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" />
              )}
              {posted && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{posted}</span>
                </>
              )}
            </p>

            {/* Wraps rather than truncating: a job title cut off mid-word is
                the one thing on the card a reader cannot afford to lose. */}
            <h2 className="mt-0.5 text-[17px] font-bold leading-snug text-slate-900">
              <Link
                href={`/jobs/${job.slug}`}
                className="relative z-10 hover:text-blue-600"
              >
                {titleCase(job.title)}
              </Link>
            </h2>

            {location && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{location}</span>
              </p>
            )}
          </div>

          {/* Above the card-covering link so it stays independently
              clickable, and sized to a full 44px tap target on mobile. */}
          <span className="relative z-10 -m-2.5 shrink-0 p-2.5">
            <SaveJobButton jobId={job.id} />
          </span>
        </div>

        {/* Status badges, on their own line so a long company name can never
            push them out of view. */}
        {(job.is_featured || job.is_urgent || job.is_remote) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
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
        )}

        {/*
          The media, below the text — the shape a feed post takes. Wide and
          short so it illustrates the card without becoming it; the previous
          version gave the photo a full tall column beside the title and it
          read as a photo gallery with captions.
        */}
        <Link
          href={`/jobs/${job.slug}`}
          className="relative z-10 mt-3 block aspect-[21/9] overflow-hidden rounded-xl bg-slate-100"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* The facts a candidate scans for, as a strip under the media. */}
        <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
          {job.employment_type && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 shrink-0" />
              {humanise(job.employment_type)}
            </div>
          )}
          {experience && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0" />
              {experience}
            </div>
          )}
          {salary ? (
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Wallet className="h-4 w-4 shrink-0" />
              {salary}
            </div>
          ) : (
            <span className="text-slate-400">Salary undisclosed</span>
          )}
        </dl>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {[job.category, job.industry].filter(Boolean).map((ref) => (
              <span
                key={ref!.slug}
                className="rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
              >
                {ref!.name}
              </span>
            ))}
          </div>

          {/* Always visible, not hover-only, so touch devices get the same
              affordance as desktop. */}
          <Link
            href={`/jobs/${job.slug}`}
            className="relative z-10 shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            View job
          </Link>
        </div>
      </div>
    </article>
  );
}
