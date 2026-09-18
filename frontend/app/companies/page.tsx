import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheck, Briefcase, MapPin, Star, Users } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { DarkFooter } from "@/components/Shared";
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
      params: { page, search, industry, hiring, per_page: 12 },
    }),
    fetchPublic<{ data: TaxonomyItem[] }>("/taxonomies/industries").catch(
      // The directory is still usable without the filter bar.
      () => ({ data: [] as TaxonomyItem[] }),
    ),
  ]);

  const { data: items, meta } = companies;

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

      <main className="flex-1 bg-slate-50">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <h1 className="text-3xl font-bold text-slate-900">Companies</h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              Oil, gas and renewable energy employers hiring on Energy Tail.
            </p>
          </div>
        </div>

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
            {industries.data.slice(0, 6).map((i) => (
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

          <p className="mb-4 text-sm text-slate-500">
            {meta.total} {meta.total === 1 ? "company" : "companies"}
          </p>

          {items.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-slate-500">No companies match these filters.</p>
              <Link href="/companies" className="mt-3 inline-block text-sm font-semibold text-blue-600">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <Link
                  key={c.id}
                  href={`/companies/${c.slug}`}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-slate-100 text-lg font-bold text-slate-500">
                      {c.name.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="flex items-center gap-1.5 font-bold leading-snug text-slate-900">
                        <span className="truncate">{c.name}</span>
                        {c.is_verified && (
                          <BadgeCheck size={15} className="shrink-0 text-blue-500" />
                        )}
                        {c.is_featured && (
                          <Star size={13} className="shrink-0 fill-amber-400 text-amber-400" />
                        )}
                      </h2>
                      {c.industry && (
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {c.industry.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
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

                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                    <Briefcase size={14} />
                    {c.open_jobs === 0
                      ? "No open roles"
                      : `${c.open_jobs} open ${c.open_jobs === 1 ? "role" : "roles"}`}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {meta.last_page > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              {meta.current_page > 1 && (
                <Link
                  href={hrefWith({ page: String(meta.current_page - 1) })}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-blue-400"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-slate-500">
                Page {meta.current_page} of {meta.last_page}
              </span>
              {meta.current_page < meta.last_page && (
                <Link
                  href={hrefWith({ page: String(meta.current_page + 1) })}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-blue-400"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <DarkFooter />
    </>
  );
}
