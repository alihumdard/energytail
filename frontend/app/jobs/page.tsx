import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { SavedJobsProvider } from "@/components/jobs/SavedJobsProvider";
import { DarkFooter } from "@/components/Shared";
import JobCard from "@/components/jobs/JobCard";
import JobFilters from "@/components/jobs/JobFilters";
import JobSearchBar from "@/components/jobs/JobSearchBar";
import ResultsToolbar from "@/components/jobs/ResultsToolbar";
import Pagination from "@/components/ui/Pagination";
import { fetchPublic } from "@/lib/api/server";
import type { JobSummary, NamedRef, Paginated } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Oil, Gas & Energy Jobs",
  description:
    "Search engineering, HSE, drilling, LNG and renewables roles with leading energy employers worldwide.",
};

/** Common searches, offered as one-tap chips beneath the search field.
 *  Kept in step with the homepage's list, which seeds the same habit. */
const POPULAR_SEARCHES = [
  "Engineer",
  "HSE",
  "Drilling",
  "LNG",
  "Pipeline",
  "Offshore",
];

/** Filters this page understands, in the order the API expects them. */
const FILTER_KEYS = [
  "search",
  "country",
  "city",
  "category",
  "industry",
  "employment_type",
  "remote",
  "featured",
  "skill",
  "tag",
  "company",
] as const;

/**
 * The public job board.
 *
 * A Server Component on purpose: the plan's SEO strategy rests on these pages
 * being rendered with their content already in the HTML, and a crawler
 * arrives with no session to run client-side fetching for.
 */
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  /** One string per filter — a repeated query parameter takes its first value. */
  const active: Record<string, string> = {};

  for (const key of FILTER_KEYS) {
    const value = params[key];
    const single = Array.isArray(value) ? value[0] : value;

    if (single) active[key] = single;
  }

  const page =
    Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1;

  const sortRaw = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const sort = sortRaw === "salary" ? "salary" : "";

  /*
   * Filter options come from the same taxonomy the admin panel manages, so
   * deactivating a country there removes it from this page too.
   *
   * Kept short for that reason: the API already caches these lists and drops
   * them the moment an admin edits one, so a long window here would serve a
   * copy the backend has already discarded — an edit appearing to do nothing
   * for the best part of an hour, in a fresh incognito window as much as any
   * other, since this cache is on the server. A miss is answered from the
   * API's own cache rather than the database.
   */
  const [jobs, countries, categories, industries] = await Promise.all([
    fetchPublic<Paginated<JobSummary>>("/jobs", {
      params: { ...active, ...(sort ? { sort } : {}), page, per_page: 15 },
    }),
    fetchPublic<{ data: NamedRef[] }>("/taxonomies/countries", {
      revalidate: 30,
    }),
    fetchPublic<{ data: NamedRef[] }>("/taxonomies/job-categories", {
      revalidate: 30,
    }),
    fetchPublic<{ data: NamedRef[] }>("/taxonomies/industries", {
      revalidate: 30,
    }),
  ]);

  const { data: results, meta } = jobs;

  /** Keeps every active filter — and the sort order — across pages. */
  function pageHref(target: number): string {
    const query = new URLSearchParams(active);
    // Was dropped here, so paging a salary-sorted board silently reverted
    // it to newest-first on page two.
    if (sort) query.set("sort", sort);
    if (target > 1) query.set("page", String(target));

    const qs = query.toString();

    return qs ? `/jobs?${qs}` : "/jobs";
  }

  const from = results.length === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);

  /** Whether the total describes the whole board or a filtered slice of it. */
  const hasFilters = Object.keys(active).length > 0;

  return (
    <>
      <SiteHeader active="Jobs" />

      {/* A plain white header on a plain white page left nothing to anchor
          the eye, and every white card blended into the page around it. The
          hero band gives the page a top and ties it visually to the
          homepage's brand color; the search bar gives it real content
          instead of just a floating title. */}
      <section className="relative overflow-hidden bg-[#0B2B26] text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B2B26] via-[#0F3A32] to-[#123832]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(62,189,62,0.28),transparent_55%)]" />
          {/* A faint grid, so the right-hand half is textured rather than a
              flat slab of green where the copy runs out. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-10">
            <div className="lg:max-w-2xl lg:flex-1">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Oil, Gas &amp; Energy Jobs
              </h1>

              {/*
                Says whether the number is the whole board or what the
                filters left. It read "3 open positions across the energy
                sector" while a Remote filter was cutting 27 down to 3,
                which described the filter's result as if it were the market.
              */}
              <p className="mt-2 text-sm text-slate-300">
                {hasFilters ? (
                  <>
                    <span className="font-semibold text-white">
                      {meta.total.toLocaleString()}
                    </span>{" "}
                    {meta.total === 1 ? "position matches" : "positions match"}{" "}
                    your filters
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-white">
                      {meta.total.toLocaleString()}
                    </span>{" "}
                    open {meta.total === 1 ? "position" : "positions"} across
                    the energy sector
                  </>
                )}
              </p>

              <JobSearchBar defaultValue={active.search} />

              {/* One tap into the searches people actually run, instead of
                  making a visitor think of a keyword from a blank field. */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-400">
                  Popular:
                </span>
                {POPULAR_SEARCHES.map((term) => (
                  <Link
                    key={term}
                    href={`/jobs?search=${encodeURIComponent(term)}`}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>

            {/* The board at a glance. Fills the right-hand emptiness with
                something true rather than decoration, and every figure is
                already on the page — no extra request. */}
            <dl className="mt-8 grid grid-cols-3 gap-3 lg:mt-0 lg:shrink-0 lg:gap-4">
              {[
                { label: meta.total === 1 ? "Open role" : "Open roles", value: meta.total },
                { label: "Countries", value: countries.data.length },
                { label: "Categories", value: categories.data.length },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-sm lg:min-w-[7rem]"
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block text-xl font-bold text-white sm:text-2xl">
                      {stat.value.toLocaleString()}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <main className="min-h-screen flex-1 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
          {/*
            Offset by the header's real height, not a round number. The
            sticky header is the utility bar (36px) plus an h-20 nav and its
            border (81px), so top-20 parked the panel 37px underneath it and
            clipped the "Filters" heading. --site-header-height keeps the two
            in step; hard-coding it here is what let them drift apart.

            max-h/overflow so a sidebar taller than the viewport can still be
            scrolled to its end — without it, "Featured" is unreachable on a
            short screen once the panel is pinned.
          */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] lg:max-h-[calc(100vh-var(--site-header-height)-2rem)] lg:overflow-y-auto">
            <JobFilters
              countries={countries.data}
              categories={categories.data}
              industries={industries.data}
              active={active}
            />
          </aside>

          <section>
            <ResultsToolbar
              active={active}
              sort={sort}
              countries={countries.data}
              categories={categories.data}
              industries={industries.data}
              summary={
                results.length === 0
                  ? "No results"
                  : `Showing ${from}–${to} of ${meta.total.toLocaleString()}`
              }
            />

            {results.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="font-medium text-slate-700">
                  No jobs match these filters
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Try widening your search, or clear the filters to see
                  everything.
                </p>
                <Link
                  href="/jobs"
                  className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  View all jobs
                </Link>
              </div>
            ) : (
              /*
                One provider around the board: the cards register their ids
                and a single request resolves which are already saved, rather
                than one request per card.
              */
              <SavedJobsProvider>
                <div className="space-y-4">
                  {results.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </SavedJobsProvider>
            )}

            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              hrefFor={pageHref}
              label="Job results pages"
              hasResults={results.length > 0}
            />
          </section>
        </div>
        </div>
      </main>

      <DarkFooter />
    </>
  );
}
