import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Clock,
  Eye,
  MapPin,
  Wallet,
} from "lucide-react";
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

/** Skill chips shown before the rest are folded into a "+N more" count. */
const MAX_SKILLS = 4;

/** "12 Mar 2027" — short enough to sit on the card's footer row. */
function deadline(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

  /*
   * Defaulted rather than trusted: these fields are new, and a cached
   * response from before they existed still satisfies the type while
   * omitting them at runtime. Reading .length off that undefined took the
   * whole detail page down with a 500.
   */
  const skills = job.skills ?? [];

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

        {/* The opening of the description, so a card says what the job
            actually is rather than only its title and salary. Already cut
            to ~200 characters by the API; clamped to two lines as well, so
            one long unbroken sentence cannot stretch the card. */}
        {job.excerpt && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
            {job.excerpt}
          </p>
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

        {/*
          The facts a candidate scans for. On a tinted strip rather than
          loose text: salary is the single most compared number on the
          board, and as plain grey it sat at the same weight as the tags
          below it.
        */}
        <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
          {salary ? (
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Wallet className="h-4 w-4 shrink-0 text-slate-400" />
              {salary}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Wallet className="h-4 w-4 shrink-0" />
              Salary undisclosed
            </div>
          )}

          {job.employment_type && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Briefcase className="h-4 w-4 shrink-0 text-slate-400" />
              {humanise(job.employment_type)}
            </div>
          )}

          {experience && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="h-4 w-4 shrink-0 text-slate-400" />
              {experience}
            </div>
          )}
        </dl>

        {/*
          Skills, then category and industry — all of them filter the board
          when clicked, which the previous plain <span> tags only looked
          like they would.

          Capped at four: some jobs carry a dozen skills, and an uncapped
          row turns the card into a tag cloud and breaks the even rhythm of
          the list. The overflow count keeps the rest honest.
        */}
        {(skills.length > 0 || job.category || job.industry) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {skills.slice(0, MAX_SKILLS).map((skill) => (
              <Link
                key={skill.slug}
                href={`/jobs?skill=${skill.slug}`}
                className="relative z-10 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
              >
                {skill.name}
              </Link>
            ))}

            {skills.length > MAX_SKILLS && (
              <span className="px-1 text-xs font-medium text-slate-400">
                +{skills.length - MAX_SKILLS} more
              </span>
            )}

            {job.category && (
              <Link
                href={`/jobs?category=${job.category.slug}`}
                className="relative z-10 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                {job.category.name}
              </Link>
            )}
            {job.industry && (
              <Link
                href={`/jobs?industry=${job.industry.slug}`}
                className="relative z-10 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
              >
                {job.industry.name}
              </Link>
            )}
          </div>
        )}

        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
          {job.deadline_at ? (
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Apply by {deadline(job.deadline_at)}</span>
            </span>
          ) : (
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              {job.views_count.toLocaleString()} views
            </span>
          )}

          {/* Always visible, not hover-only, so touch devices get the same
              affordance as desktop. The arrow shifts on hover to signal it
              goes somewhere rather than submitting something. */}
          <Link
            href={`/jobs/${job.slug}`}
            className="relative z-10 flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            View job
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
