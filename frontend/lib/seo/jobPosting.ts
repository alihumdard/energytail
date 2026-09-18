import type { JobPosting, WithContext } from "schema-dts";
import type { JobDetail } from "@/lib/api/types";
import { toNumber } from "@/lib/money";
import { SITE_NAME, absoluteUrl } from "./site";

/**
 * JobPosting structured data — what makes a listing eligible for the Google
 * Jobs box, which is the single largest traffic source a jobs board has.
 *
 * Google validates this strictly and fails quietly: a wrong enum or a missing
 * required field means the listing is skipped with no visible symptom on the
 * page. So the mapping below is deliberate about every value it emits, and
 * omits a field entirely rather than guessing at it.
 */

/**
 * Google accepts a fixed vocabulary for employmentType; our own values are
 * snake_case and would simply be ignored.
 */
const EMPLOYMENT_TYPES: Record<string, string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACTOR",
  temporary: "TEMPORARY",
  internship: "INTERN",
  freelance: "CONTRACTOR",
  volunteer: "VOLUNTEER",
};

/**
 * unitText accepts only these five values.
 *
 * Both "year" and "yearly" appear in the data — the column was written by two
 * different code paths — so both spellings map here rather than only the one
 * that happens to be more common.
 */
const SALARY_UNITS: Record<string, "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR"> = {
  hour: "HOUR",
  hourly: "HOUR",
  day: "DAY",
  daily: "DAY",
  week: "WEEK",
  weekly: "WEEK",
  month: "MONTH",
  monthly: "MONTH",
  year: "YEAR",
  yearly: "YEAR",
  annual: "YEAR",
};

export function jobPostingSchema(job: JobDetail): WithContext<JobPosting> {
  /*
   * description is required and Google expects the full text, not a summary.
   * The stored fields are separate columns, so they are joined back into one
   * document in the order a reader would meet them on the page.
   */
  const description =
    [job.description, job.responsibilities, job.requirements, job.benefits]
      .filter(Boolean)
      .join("\n\n") || job.title;

  const schema: WithContext<JobPosting> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    url: absoluteUrl(`/jobs/${job.slug}`),
    /*
     * datePosted is required. published_at is guaranteed non-null here — the
     * public endpoint only ever returns published jobs — but the type allows
     * null, so it falls back rather than emitting "null".
     */
    datePosted: job.published_at ?? new Date().toISOString(),
    hiringOrganization: job.company
      ? {
          "@type": "Organization",
          name: job.company.name,
          sameAs: absoluteUrl(`/companies/${job.company.slug}`),
          ...(job.company_profile?.website ? { url: job.company_profile.website } : {}),
        }
      : { "@type": "Organization", name: SITE_NAME },
  };

  if (job.deadline_at) schema.validThrough = job.deadline_at;

  if (job.reference) schema.identifier = {
    "@type": "PropertyValue",
    name: job.company?.name ?? SITE_NAME,
    value: job.reference,
  };

  const employmentType = job.employment_type
    ? EMPLOYMENT_TYPES[job.employment_type]
    : undefined;
  if (employmentType) schema.employmentType = employmentType;

  /*
   * Location. Google requires jobLocation unless the role is fully remote,
   * in which case it wants jobLocationType TELECOMMUTE plus a region the
   * applicant must be in.
   */
  const place = (job.city || job.country)
    ? {
        "@type": "Place" as const,
        address: {
          "@type": "PostalAddress" as const,
          ...(job.city ? { addressLocality: job.city.name } : {}),
          ...(job.country
            ? { addressRegion: job.country.name, addressCountry: job.country.code }
            : {}),
        },
      }
    : undefined;

  if (job.is_remote) {
    schema.jobLocationType = "TELECOMMUTE";
    if (place) schema.applicantLocationRequirements = {
      "@type": "Country",
      name: job.country?.name ?? "Worldwide",
    };
  }

  if (place) schema.jobLocation = place;

  /*
   * Salary is emitted only when the employer published a real figure. A job
   * with salary_is_hidden returns null here, and inventing a range to satisfy
   * the schema would be publishing a number the employer chose to withhold.
   */
  const { salary } = job;
  const unit = salary?.period ? SALARY_UNITS[salary.period] : undefined;

  /*
   * Google requires minValue/maxValue to be numbers and drops the whole
   * baseSalary block when they are quoted — and the API sends decimal
   * strings. An unparseable figure is treated as absent: a rich result with
   * no salary beats one advertising a wrong number.
   */
  const minValue = toNumber(salary?.min);
  const maxValue = toNumber(salary?.max);

  if (salary && unit && salary.currency && (minValue !== null || maxValue !== null)) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      currency: salary.currency,
      value: {
        "@type": "QuantitativeValue",
        ...(minValue !== null ? { minValue } : {}),
        ...(maxValue !== null ? { maxValue } : {}),
        unitText: unit,
      },
    };
  }

  if (job.industry) schema.industry = job.industry.name;
  if (job.category) schema.occupationalCategory = job.category.name;

  if (job.skills.length > 0) schema.skills = job.skills.map((s) => s.name).join(", ");

  if (job.experience_min !== null) {
    schema.experienceRequirements = {
      "@type": "OccupationalExperienceRequirements",
      monthsOfExperience: job.experience_min * 12,
    };
  }

  return schema;
}
