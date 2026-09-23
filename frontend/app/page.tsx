import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { DarkFooter } from "@/components/Shared";
import NewsletterSignup from "@/components/home/NewsletterSignup";
import {
  Search,
  MapPin,
  Building2,
  Briefcase,
  Globe2,
  FileText,
  BadgeCheck,
  Clock,
  Star,
  ArrowRight,
  HardHat,
  ShieldCheck,
  Cog,
  Wrench,
  Truck,
  Mountain,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { fetchPublic } from "@/lib/api/server";
import JsonLd from "@/lib/seo/JsonLd";
import { websiteSchema } from "@/lib/seo/schemas";
import type { HomePayload } from "@/lib/api/types";

export const metadata: Metadata = {
  // absolute: the layout template would otherwise append the site name to a
  // title that already is the site name.
  title: { absolute: "Energy Tail | Oil, Gas & Energy Jobs" },
  description:
    "Find engineering, HSE, drilling, LNG and renewables roles with leading energy employers worldwide.",
  alternates: { canonical: "/" },
};

const POPULAR_SEARCHES = ["Engineer", "HSE", "Drilling", "LNG", "QA/QC", "Pipeline", "Offshore"];

/** A real icon per top-level category, keyed by slug — no emoji, consistent
 *  weight and sizing. Keyed to the 8 parent groups; a category added later
 *  falls back to Briefcase rather than needing this map updated first. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  engineering: Cog,
  "drilling-well-operations": HardHat,
  "production-operations": Wrench,
  "hse-environmental": ShieldCheck,
  "pipeline-engineering-operations": Truck,
  "instrument-technicians": SlidersHorizontal,
  "geoscience-exploration": Mountain,
  "projects-procurement-supply-chain": Briefcase,
};

/** Stand-in photo per article category, used only when the homepage feed
 *  has no featured image for that article (it never does today). Fixed
 *  Unsplash photo ids so the same category always shows the same image
 *  rather than a random one on every request. */
const ARTICLE_CATEGORY_IMAGES: Record<string, string> = {
  "oil-gas-articles": "https://images.unsplash.com/photo-1505027082971-a5e04d1a1a1e?w=600&h=400&fit=crop&q=70",
  "renewable-energy-articles": "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=400&fit=crop&q=70",
  "lng-articles": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=400&fit=crop&q=70",
  "hse-articles": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&h=400&fit=crop&q=70",
  "solar-energy-articles": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop&q=70",
  "power-generation-articles": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=400&fit=crop&q=70",
  "technology-articles": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop&q=70",
  "careers-advice-articles": "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop&q=70",
  "market-insights-articles": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop&q=70",
};
const DEFAULT_ARTICLE_IMAGE =
  "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=400&fit=crop&q=70";

/** Stand-in logo photos for companies with no logo_path on file yet — a
 *  small fixed set, picked deterministically per company so the same one
 *  always gets the same photo instead of a plain letter tile. */
const COMPANY_LOGO_FALLBACKS = [
  "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop&q=70",
  "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=200&h=200&fit=crop&q=70",
  "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=200&h=200&fit=crop&q=70",
  "https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=200&h=200&fit=crop&q=70",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop&q=70",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=200&fit=crop&q=70",
];

function companyFallbackImage(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;

  return COMPANY_LOGO_FALLBACKS[hash % COMPANY_LOGO_FALLBACKS.length];
}

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function humanise(value: string | null): string {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Job titles come from free-text employer input, so "drilling" and "DRILLING
 *  engineer" both need to read as "Drilling Engineer" on the card. */
function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

/** Normalises the free-text salary_period field ("year" and "yearly" both
 *  appear in real data) to one consistent label. */
function periodLabel(period: string | null): string {
  if (!period) return "";

  const normalised = period.toLowerCase().replace(/ly$/, "");
  const map: Record<string, string> = {
    year: "year",
    month: "month",
    week: "week",
    day: "day",
    hour: "hour",
  };

  return map[normalised] ? `/${map[normalised]}` : `/${period}`;
}

/** Only rendered when the employer chose to publish a salary. */
function salaryLabel(job: HomePayload["featured_jobs"][number]): string | null {
  if (!job.salary_min && !job.salary_max) return null;

  const currency = job.salary_currency ?? "USD";
  const round = (v: string | number | null) =>
    v === null ? null : Math.round(Number(v)).toLocaleString();

  const min = round(job.salary_min);
  const max = round(job.salary_max);
  const period = periodLabel(job.salary_period);

  if (min && max) return `${currency} ${min}–${max}${period}`;
  return `${currency} ${min ?? max}${period}`;
}

/**
 * The homepage.
 *
 * A Server Component: this is the page a crawler and a first-time visitor
 * both land on, and the plan's whole strategy rests on it arriving with its
 * content already in the HTML.
 */
export default async function HomePage() {
  /*
   * Short, because this is the second of two caches in front of the same
   * data. The API caches the payload itself and drops it the moment an admin
   * edits a category, so a longer window here would hold a copy the backend
   * has already thrown away — an admin ticking "Featured" saw nothing change
   * for minutes, in a fresh incognito window too, since both caches sit on
   * the server where a hard refresh cannot reach them.
   *
   * Cheap to keep short: a miss here is served from the API's own cache, not
   * from the database.
   */
  const { data } = await fetchPublic<{ data: HomePayload }>("/home", {
    revalidate: 30,
  });

  const { stats, categories, featured_jobs: jobs, companies, articles } = data;

  const counters = [
    { icon: Briefcase, value: stats.jobs, label: "Open Jobs" },
    { icon: Building2, value: stats.companies, label: "Companies" },
    { icon: Globe2, value: stats.countries, label: "Countries" },
    { icon: FileText, value: stats.articles, label: "Articles" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/*
        Declares the site and its search endpoint, which is what allows a
        sitelinks search box to appear under the brand in results.
      */}
      <JsonLd data={websiteSchema()} />

      <SiteHeader active="" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0B2B26] text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0B2B26] via-[#0B2B26]/85 to-[#0B2B26]/40" />
          <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_75%_30%,rgba(62,189,62,0.35),transparent_55%)]" />
          <div className="h-full w-full bg-[linear-gradient(to_bottom,#123832,#081C18)]" />
        </div>

        <div className="relative z-20 mx-auto max-w-7xl px-6 pb-14 pt-16 md:pb-16 md:pt-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Find Your Next Opportunity in{" "}
              <span className="text-blue-400">Oil, Gas &amp; Energy</span>
            </h1>
            {/*
              The count is the real one. The mock promised "10,000+ jobs",
              which a visitor disproves the moment they reach the board.
            */}
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
              {stats.jobs.toLocaleString()} open{" "}
              {stats.jobs === 1 ? "role" : "roles"} from {stats.companies}{" "}
              {stats.companies === 1 ? "employer" : "employers"} across{" "}
              {stats.countries} {stats.countries === 1 ? "country" : "countries"} — in Oil
              &amp; Gas, Renewable Energy, LNG, Petrochemicals, Power and Offshore.
            </p>
          </div>

          {/* Search — a real form, submitting to the board */}
          <form
            action="/jobs"
            method="GET"
            className="mt-10 max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
          >
            <div className="flex text-sm font-semibold">
              <span className="flex items-center gap-2 border-b-2 border-blue-600 px-6 py-3.5 text-blue-600">
                <Briefcase size={15} /> Find Jobs
              </span>
              <Link
                href="/companies"
                className="flex items-center gap-2 px-6 py-3.5 text-slate-500 transition-colors hover:text-blue-600"
              >
                <Building2 size={15} /> Find Companies
              </Link>
            </div>

            <div className="flex flex-col gap-3 p-4 md:flex-row md:items-stretch">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3.5 transition-colors focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
                <Search size={16} className="shrink-0 text-slate-400" />
                <input
                  name="search"
                  placeholder="Job title, keywords or company"
                  className="w-full py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 transition-colors focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 md:w-48">
                <MapPin size={16} className="shrink-0 text-slate-400" />
                <select
                  name="category"
                  defaultValue=""
                  className="w-full bg-transparent py-3 text-sm text-slate-600 outline-none"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/40"
              >
                <Search size={15} /> Search Jobs
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">Popular searches:</span>
            {POPULAR_SEARCHES.map((term) => (
              <Link
                key={term}
                href={`/jobs?search=${encodeURIComponent(term)}`}
                className="rounded-full bg-white/10 px-3 py-1.5 font-medium text-slate-200 transition-colors hover:bg-white/20 hover:text-white"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Browse Jobs by Category
                </h2>
                <p className="mt-1.5 text-sm text-slate-500">
                  Find roles in the discipline you know best.
                </p>
              </div>
              <Link
                href="/jobs"
                className="group hidden shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex"
              >
                View all jobs
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {categories.map((c) => {
                const Icon = CATEGORY_ICONS[c.slug] ?? Briefcase;

                return (
                  /*
                    Stacked on a phone, side by side from sm up. In two
                    columns at 360px a 56px circle and p-5 padding left
                    barely 60px for the label, so every name was truncated
                    to a few characters and the tiles read as icons with no
                    words — "Drilling & Well Operations" became "Dri…".
                  */
                  <Link
                    key={c.slug}
                    href={`/jobs?category=${c.slug}`}
                    className="group relative flex flex-col items-center gap-2.5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 sm:flex-row sm:gap-4 sm:p-5 sm:text-left"
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white sm:h-14 sm:w-14">
                      <Icon size={24} strokeWidth={1.75} className="sm:size-[26px]" />
                    </div>

                    <div className="min-w-0 sm:flex-1">
                      {/* Wraps to two lines rather than truncating: the name
                          is the only thing on the tile that identifies it. */}
                      <p className="text-[13px] font-semibold leading-snug text-slate-800 transition-colors group-hover:text-blue-700 sm:truncate sm:text-[15px]">
                        {c.name}
                      </p>

                      {/*
                        The count carries the weight it earns: it is what a
                        visitor compares one category against another by,
                        and as faint grey text it read as a caption. A
                        category with nothing in it says so plainly rather
                        than showing "0 jobs" as though that were a result.
                      */}
                      <p
                        className={`mt-1 text-xs font-medium ${
                          c.jobs_count > 0 ? "text-blue-600" : "text-slate-400"
                        }`}
                      >
                        {c.jobs_count > 0
                          ? `${c.jobs_count} open ${c.jobs_count === 1 ? "role" : "roles"}`
                          : "No roles yet"}
                      </p>
                    </div>

                    {/* Hidden on a phone, where the tile is stacked and an
                        arrow off to one side has nothing to point from. */}
                    <ArrowRight
                      size={16}
                      className="hidden shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-blue-600 sm:block"
                    />
                  </Link>
                );
              })}
            </div>

            <Link
              href="/jobs"
              className="mt-8 flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:hidden"
            >
              View all jobs
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}

      {/* Jobs */}
      {jobs.length > 0 && (
        <section className="bg-slate-100 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Latest Opportunities
                </h2>
                <p className="mt-1.5 text-sm text-slate-500">
                  Fresh roles from employers across oil, gas &amp; energy.
                </p>
              </div>
              <Link
                href="/jobs"
                className="group hidden shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex"
              >
                View all jobs
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => {
                const salary = salaryLabel(job);

                return (
                  <article
                    key={job.id}
                    className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50"
                  >
                    {job.is_featured && (
                      <span className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-amber-950 shadow-sm">
                        <Star size={11} className="fill-amber-950" />
                        Featured
                      </span>
                    )}

                    <div className="flex items-start gap-3">
                      <img
                        src={
                          job.company?.logo_path ||
                          companyFallbackImage(job.company?.slug ?? job.slug)
                        }
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-slate-200/60"
                      />
                      <div className="min-w-0 flex-1 pt-0.5">
                        <h3 className="font-bold leading-snug text-slate-900">
                          <Link
                            href={`/jobs/${job.slug}`}
                            className="transition-colors group-hover:text-blue-600"
                          >
                            {titleCase(job.title)}
                          </Link>
                        </h3>
                        {job.company && (
                          <Link
                            href={`/companies/${job.company.slug}`}
                            className="text-sm text-slate-500 hover:text-blue-600"
                          >
                            {job.company.name}
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {job.category && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {job.category.name}
                        </span>
                      )}
                      {job.employment_type && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {humanise(job.employment_type)}
                        </span>
                      )}
                      {job.is_urgent && (
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          Urgent
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500">
                      <p className="flex items-center gap-1.5">
                        <MapPin size={13} className="shrink-0 text-slate-400" />
                        {job.is_remote
                          ? "Remote"
                          : job.location_label ??
                            [job.city?.name, job.country?.name].filter(Boolean).join(", ") ??
                            "—"}
                      </p>
                      {salary && (
                        <p className="text-sm font-semibold text-slate-800">{salary}</p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <p className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock size={12} className="shrink-0" />
                        Posted {formatDate(job.published_at)}
                      </p>
                      <Link
                        href={`/jobs/${job.slug}`}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
                      >
                        View details
                        <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <Link
              href="/jobs"
              className="mt-8 flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:hidden"
            >
              View all jobs
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}

      {/* Companies */}
      {companies.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Employers Hiring Now
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Companies actively recruiting on Energy Tail.
              </p>
            </div>
            <Link
              href="/companies"
              className="group hidden shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex"
            >
              All companies
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4 sm:gap-4">
            {companies.map((c) => (
              <Link
                key={c.slug}
                href={`/companies/${c.slug}`}
                // Stacked on a phone for the same reason the category tiles
                // are: beside a 44px logo in a half-width column, every
                // company name was truncated to a word or two.
                className="group flex h-full flex-col items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 sm:flex-row sm:gap-3 sm:text-left"
              >
                <img
                  src={c.logo_path || companyFallbackImage(c.slug)}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-slate-200/60 sm:h-11 sm:w-11"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center justify-center gap-1 text-[13px] font-semibold text-slate-800 transition-colors group-hover:text-blue-700 sm:justify-start sm:text-sm">
                    <span className="leading-snug sm:truncate">{c.name}</span>
                    {c.is_verified && (
                      <BadgeCheck size={13} className="shrink-0 text-blue-500" />
                    )}
                  </p>

                  {/*
                    The reason this section exists is that these companies
                    are hiring, so the count is coloured rather than left as
                    grey furniture — and a company with nothing open says so
                    instead of advertising "0 open roles".
                  */}
                  <span
                    className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      c.open_jobs > 0
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.open_jobs > 0
                      ? `${c.open_jobs} open ${c.open_jobs === 1 ? "role" : "roles"}`
                      : "No roles yet"}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/companies"
            className="mt-8 flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:hidden"
          >
            All companies
            <ArrowRight size={15} />
          </Link>
          </div>
        </section>
      )}

      {/* Counters */}
      <section className="bg-[#0B2B26]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 gap-x-6 px-6 py-14 md:grid-cols-4 md:gap-y-0">
          {counters.map((s, i) => (
            <div
              key={s.label}
              className={`text-center md:border-l md:border-white/10 md:first:border-l-0 ${
                i % 2 === 0 ? "border-r border-white/10 md:border-r-0" : ""
              }`}
            >
              <s.icon className="mx-auto mb-3 text-blue-400" size={24} />
              <p className="text-3xl font-extrabold text-white md:text-4xl">
                {s.value.toLocaleString()}
              </p>
              <p className="mt-1.5 text-sm font-medium text-slate-300">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Articles */}
      {articles.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Industry Insights</h2>
            <Link href="/articles" className="text-sm font-semibold text-blue-600 hover:underline">
              All articles
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {articles.map((a) => (
              <article
                key={a.slug}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50"
              >
                {/* No featured image comes back from the homepage feed, so a
                    category-matched stock photo stands in rather than
                    leaving the card looking unfinished. */}
                <Link
                  href={`/articles/${a.slug}`}
                  className="relative flex h-40 shrink-0 items-center justify-center overflow-hidden bg-slate-200"
                >
                  <img
                    src={
                      (a.category && ARTICLE_CATEGORY_IMAGES[a.category.slug]) ||
                      DEFAULT_ARTICLE_IMAGE
                    }
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0" />
                  {a.category && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                      {a.category.name}
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-bold leading-snug text-slate-900">
                    <Link
                      href={`/articles/${a.slug}`}
                      className="line-clamp-2 transition-colors group-hover:text-blue-600"
                    >
                      {a.title}
                    </Link>
                  </h3>
                  {a.excerpt && (
                    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
                      {a.excerpt}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-400">
                    {a.author && <span className="font-medium text-slate-600">{a.author.name}</span>}
                    <span>{formatDate(a.published_at)}</span>
                    {a.reading_minutes && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} /> {a.reading_minutes} min
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <NewsletterSignup />
        </div>
      </section>

      <DarkFooter />
    </div>
  );
}
