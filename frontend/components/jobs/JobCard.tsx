import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
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
  const thumbnail = jobThumbnail(
    job.category?.slug ?? null,
    job.slug,
    job.featured_image_path,
  );

  return (
    <article
      // flex column, full height: in a grid the cards are stretched to a
      // common height, and without this the content sat at the top of each
      // one leaving the footers at different heights down the row.
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg ${
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

      {/*
        Two halves side by side: a square photo, then everything else.
        Stacked on a phone, where a half-width column leaves neither the
        picture nor the text enough room to be read.
      */}
      <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-5">
        <Link
          href={`/jobs/${job.slug}`}
          // Capped, not a true half. A square that is genuinely half of a
          // full-width row is around 440px tall, and the card's text does
          // not fill that — the card grew to the photo's height and left a
          // band of empty space above the footer. The cap keeps the photo
          // roughly as tall as the text it sits beside.
          //
          // self-start is what keeps it square: as a flex child it is
          // stretched to the text column's height by default, and that
          // height beats aspect-square.
          className="relative z-10 block aspect-square w-full shrink-0 self-start overflow-hidden rounded-xl bg-slate-100 sm:w-1/2 sm:max-w-[13rem]"
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

        <div className="flex min-w-0 flex-1 flex-col justify-center">
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
            {/* Company and timestamp: the "posted by" line of a feed post.

                Truncated rather than wrapped: a long company name broke to
                a second line and left the tick and the date stranded below
                it, which read as two separate facts. */}
            <p className="flex items-center gap-x-1.5 text-sm">
              {job.company ? (
                <Link
                  href={`/companies/${job.company.slug}`}
                  title={job.company.name}
                  className="relative z-10 truncate font-semibold text-slate-700 hover:text-blue-600"
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
                <span className="shrink-0 whitespace-nowrap text-xs text-slate-400">
                  · {posted}
                </span>
              )}
            </p>

            {/* Wraps rather than truncating: a job title cut off mid-word is
                the one thing on the card a reader cannot afford to lose. */}
            <h2 className="mt-1 line-clamp-2 text-[17px] font-bold leading-snug text-slate-900">
              <Link
                href={`/jobs/${job.slug}`}
                className="relative z-10 hover:text-blue-600"
              >
                {titleCase(job.title)}
              </Link>
            </h2>

            {location && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{location}</span>
              </p>
            )}
          </div>

          {/* Above the card-covering link so both stay independently
              clickable. The action sits with the bookmark at the top
              rather than on the card's base: it is the card's primary
              affordance, and at the bottom it trailed a row of facts.

              Hidden below sm, where the header has no room for it — the
              whole card is a link there, and the bottom row keeps its own
              copy for touch. */}
          {/* Save first, then open: the bookmark is the lighter, reversible
              action and the arrow is the one that leaves the card.

              Two buttons, not one — save is a toggle that holds state and
              "view" is navigation, so a single control could not report
              which of the two it had done. As icons they cost the header
              the width of the title's first word instead of a label. */}
          <div className="relative z-10 flex shrink-0 items-center gap-0.5 rounded-xl border border-blue-200 bg-blue-50 p-0.5 sm:gap-1">
            <SaveJobButton jobId={job.id} />
            <Link
              href={`/jobs/${job.slug}`}
              aria-label={`View ${job.title}`}
              title="View job"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-white hover:shadow-sm sm:flex"
            >
              {/* An eye, not an arrow: a bare arrow beside a bookmark reads
                  as "next", and the action here is to look at the job.
                  Labelled as well, so the glyph is not carrying the whole
                  meaning on its own. */}
              <Eye className="h-[18px] w-[18px]" />
              View
            </Link>
          </div>
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
          // Three lines in a narrow column, two on a full-width row: the
          // clamp is there to keep cards even, and two lines of a
          // three-across column is barely a sentence.
          <p className="my-2.5 line-clamp-3 text-sm leading-relaxed text-slate-500">
            {job.excerpt}
          </p>
        )}

        {/*
          One row: the facts a candidate scans for, then the action. They
          were a tinted strip and a bordered footer stacked on top of each
          other, which cost two bands of vertical space to say very little.

          Separated by dots rather than boxes — at this size the tint and
          the rule were doing more work than the content needed.

          No mt-auto: the photo is the taller column, and mt-auto handed
          the whole difference to this row as one gap under the
          description. The text block now sits together and the column is
          centred against the photo, so the slack is split evenly above
          and below it.
        */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-100 pt-2.5">
          <dl className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
            {salary ? (
              <div className="flex items-center gap-1.5 whitespace-nowrap font-bold text-slate-900">
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
              <>
                <span className="text-slate-300" aria-hidden>
                  ·
                </span>
                <div className="whitespace-nowrap text-slate-600">
                  {humanise(job.employment_type)}
                </div>
              </>
            )}

            {experience && (
              <>
                <span className="text-slate-300" aria-hidden>
                  ·
                </span>
                <div className="whitespace-nowrap text-slate-600">{experience}</div>
              </>
            )}

            <span className="text-slate-300" aria-hidden>
              ·
            </span>
            {job.deadline_at ? (
              <div className="whitespace-nowrap text-slate-400">
                Apply by {deadline(job.deadline_at)}
              </div>
            ) : (
              <div className="min-w-0 text-slate-400">
                {job.views_count.toLocaleString()} views
              </div>
            )}
          </dl>

          {/* The header's copy is hidden below sm; this one takes over
              there, so a phone still gets an explicit tap target. */}
          <Link
            href={`/jobs/${job.slug}`}
            className="relative z-10 flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 sm:hidden"
          >
            View job
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        </div>
      </div>
    </article>
  );
}
