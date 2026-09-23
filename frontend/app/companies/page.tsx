import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  MapPin,
  Search,
  Star,
  Users,
  X,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { DarkFooter } from "@/components/Shared";
import Pagination from "@/components/ui/Pagination";
import { fetchPublic } from "@/lib/api/server";
import type { Paginated, PublicCompany, TaxonomyItem } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Energy Companies Hiring Now",
  description:
    "Browse oil, gas and renewable energy employers and see who is hiring across the industry.",
};

/**
 * The public company directory.
 *
 * A Server Component, like the job board: the plan's SEO strategy rests on
 * this content being in the HTML when a crawler arrives with no session.
 */
export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const read = (key: string): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const page = Number(read("page") ?? 1) || 1;
  const search = read("search");
  const industry = read("industry");
  const hiring = read("hiring");

  const [companies, industries] = await Promise.all([
    fetchPublic<Paginated<PublicCompany>>("/companies", {
      // 9 fills the three-column grid exactly, as the article feed does —
      // 12 left a ragged last row at the wide breakpoint.
      params: { page, search, industry, hiring, per_page: 9 },
    }),
    fetchPublic<{ data: TaxonomyItem[] }>("/taxonomies/industries").catch(
      // The directory is still usable without the filter bar.
      () => ({ data: [] as TaxonomyItem[] }),
    ),
  ]);

  const { data: items, meta } = companies;

  /*
   * Open roles across the employers on this page.
   *
   * Deliberately not labelled as a site-wide total: the API paginates, so
   * this can only see the current page. With 8 companies on one page it is
   * the whole directory; past that it would be a subset, so the label says
   * "on this page" rather than claiming more than it knows.
   */
  const totalOpenRoles = items.reduce((sum, c) => sum + (c.open_jobs ?? 0), 0);
  const rolesSpanWholeDirectory = meta.last_page === 1;

  /** Keeps the current filters when only the page changes. */
  const hrefWith = (overrides: Record<string, string | undefined>): string => {
    const query = new URLSearchParams();
    const merged = { search, industry, hiring, ...overrides };

    for (const [key, value] of Object.entries(merged)) {
      if (value) query.set(key, value);
    }

    const qs = query.toString();
    return qs ? `/companies?${qs}` : "/companies";
  };

  return (
    <>
      <SiteHeader active="Companies" />

      {/* The same dark band the job board and the article feed open with, so
          the three public sections of the site read as one place. It was a
          white strip on a white page, which gave the eye nothing to start
          from. */}
      <section className="relative overflow-hidden bg-[#0B2B26] text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B2B26] via-[#0F3A32] to-[#123832]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(62,189,62,0.28),transparent_55%)]" />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-10">
            <div className="lg:max-w-2xl lg:flex-1">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Companies
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Oil, gas and renewable energy employers hiring on Energy Tail.
              </p>

              {/*
                Like the article feed, this page already read ?search= and
                passed it to the API with nothing on screen to type into —
                the filter existed and could not be reached. A plain GET
                form: no JS needed for a field that only writes a URL.
              */}
              <form
                action="/companies"
                method="GET"
                className="mt-6 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-blue-500/40"
              >
                {/* Keeps the chosen filters when searching within them. */}
                {industry && (
                  <input type="hidden" name="industry" value={industry} />
                )}
                {hiring && <input type="hidden" name="hiring" value={hiring} />}

                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="search"
                    defaultValue={search ?? ""}
                    placeholder="Search employers by name"
                    aria-label="Search companies"
                    className="w-full bg-transparent py-3 pl-11 pr-2 text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:px-7"
                >
                  <Search size={16} />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </form>
            </div>

            {/* The directory at a glance. Both figures are already on the
                page, so this costs no extra request. */}
            <dl className="mt-8 grid grid-cols-2 gap-3 lg:mt-0 lg:shrink-0 lg:gap-4">
              {[
                {
                  label: meta.total === 1 ? "Employer" : "Employers",
                  value: meta.total,
                },
                {
                  label: rolesSpanWholeDirectory
                    ? "Open roles"
                    : "Roles here",
                  value: totalOpenRoles,
                },
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

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6 flex flex-wrap gap-2">
            <Link
              href={hrefWith({ industry: undefined, page: undefined })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                !industry
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-400"
              }`}
            >
              All industries
            </Link>
            {/* All of them, not the first six: the cut was arbitrary and
                silently hid industries a visitor might be looking for. */}
            {industries.data.map((i) => (
              <Link
                key={i.slug}
                href={hrefWith({ industry: i.slug, page: undefined })}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  industry === i.slug
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-400"
                }`}
              >
                {i.name}
              </Link>
            ))}

            <Link
              href={hrefWith({ hiring: hiring ? undefined : "1", page: undefined })}
              className={`ml-auto rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                hiring
                  ? "bg-emerald-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-400"
              }`}
            >
              Hiring now
            </Link>
          </div>

          {/* A search term needs a way out of itself: with the field up in
              the hero, the only way back was editing the URL by hand. */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-500">
              {search ? (
                <>
                  <span className="font-semibold text-slate-700">
                    {meta.total}
                  </span>{" "}
                  {meta.total === 1 ? "result" : "results"} for “{search}”
                </>
              ) : (
                <>
                  {meta.total} {meta.total === 1 ? "company" : "companies"}
                </>
              )}
            </p>

            {search && (
              <Link
                href={hrefWith({ search: undefined, page: undefined })}
                className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
              >
                Clear search
                <X className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-slate-500">No companies match these filters.</p>
              <Link href="/companies" className="mt-3 inline-block text-sm font-semibold text-blue-600">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {items.map((c) => (
                <Link
                  key={c.id}
                  href={`/companies/${c.slug}`}
                  // h-full and a flex column so cards in a row match height
                  // however long each name runs; the lift on hover is the
                  // one the job and article cards use.
                  className={`group flex h-full flex-col rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    c.is_featured
                      ? "border-amber-200 ring-1 ring-amber-100"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg font-bold text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                      {c.name.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      {/* Wraps rather than truncating — "Nitzsche, Koch and
                          Lind" is the card's subject and was being cut. */}
                      <h2 className="flex items-start gap-1.5 font-bold leading-snug text-slate-900">
                        <span className="min-w-0">{c.name}</span>
                        {c.is_verified && (
                          <BadgeCheck
                            size={15}
                            className="mt-0.5 shrink-0 text-blue-500"
                          />
                        )}
                      </h2>
                      {c.industry && (
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {c.industry.name}
                        </p>
                      )}
                    </div>

                    {c.is_featured && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                        <Star size={10} className="fill-amber-500 text-amber-500" />
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                    {(c.city || c.country) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        {[c.city?.name, c.country?.name].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {c.company_size && (
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} className="text-slate-400" />
                        {c.company_size}
                      </span>
                    )}
                  </div>

                  {/* flex-1 absorbs a stretched card's spare height and
                      items-end holds the row at the bottom, so the role
                      counts line up across a row whatever sits above them. */}
                  <div className="mt-4 flex flex-1 items-end justify-between gap-2 border-t border-slate-100 pt-3.5">
                    <p
                      className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                        c.open_jobs === 0 ? "text-slate-400" : "text-blue-600"
                      }`}
                    >
                      <Briefcase size={14} />
                      {c.open_jobs === 0
                        ? "No open roles"
                        : `${c.open_jobs} open ${c.open_jobs === 1 ? "role" : "roles"}`}
                    </p>

                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-blue-600" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* The numbered control the job board and article feed use — this
              page had been left on one-step-at-a-time paging. */}
          <Pagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            hrefFor={(target) => hrefWith({ page: String(target) })}
            label="Company pages"
            hasResults={items.length > 0}
          />
        </div>
      </main>

      <DarkFooter />
    </>
  );
}
