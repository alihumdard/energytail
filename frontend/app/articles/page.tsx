import Link from "next/link";
import type { Metadata } from "next";
import { Clock, Eye, Search, Star, X } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { DarkFooter } from "@/components/Shared";
import { fetchPublic } from "@/lib/api/server";
import Pagination from "@/components/ui/Pagination";
import { articleThumbnail } from "@/lib/thumbnails";
import type { Paginated, PublicArticle, TaxonomyItem } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Energy Industry Insights & Articles",
  description:
    "Careers advice, market analysis and technical insight for oil, gas and renewable energy professionals.",
};

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * The public article feed.
 *
 * A Server Component, like the job board: the plan's SEO strategy rests on
 * this content being in the HTML when a crawler arrives with no session.
 */
export default async function ArticlesPage({
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
  const category = read("category");
  const search = read("search");

  const [articles, categories] = await Promise.all([
    fetchPublic<Paginated<PublicArticle>>("/articles", {
      // 9 fills the three-column grid exactly — 12 left a ragged last row
      // at the wide breakpoint, and a page that divides by the column count
      // is what makes the grid read as a grid.
      params: { page, category, search, per_page: 9 },
    }),
    fetchPublic<{ data: TaxonomyItem[] }>("/taxonomies/article-categories").catch(
      // The feed is still readable without the filter bar, so a failure here
      // must not take the page down with it.
      () => ({ data: [] as TaxonomyItem[] }),
    ),
  ]);

  const { data: items, meta } = articles;

  /** Keeps the current filters when only the page changes. */
  const pageHref = (target: number): string => {
    const query = new URLSearchParams();
    if (category) query.set("category", category);
    if (search) query.set("search", search);
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `/articles?${qs}` : "/articles";
  };

  return (
    <>
      <SiteHeader active="Articles" />

      {/* The same dark band the job board opens with, so the two public
          sections of the site read as one place. It was a white strip on a
          white page, which gave the eye nothing to start from. */}
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
                Insights &amp; Articles
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Careers advice, market analysis and technical insight for oil,
                gas and renewable energy professionals.
              </p>

              {/*
                The page has always read ?search= and passed it to the API —
                there was simply nothing on screen to type one into, so the
                filter existed and could not be reached. A plain GET form:
                no JS needed for a field that only writes a URL.
              */}
              <form
                action="/articles"
                method="GET"
                className="mt-6 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-blue-500/40"
              >
                {/* Keeps the chosen category when searching within it. */}
                {category && (
                  <input type="hidden" name="category" value={category} />
                )}

                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="search"
                    defaultValue={search ?? ""}
                    placeholder="Search articles by title or topic"
                    aria-label="Search articles"
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

            {/* Fills the right-hand emptiness with something true rather
                than decoration — both figures are already on the page. */}
            <dl className="mt-8 grid grid-cols-2 gap-3 lg:mt-0 lg:shrink-0 lg:gap-4">
              {[
                {
                  label: meta.total === 1 ? "Article" : "Articles",
                  value: meta.total,
                },
                { label: "Topics", value: categories.data.length },
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
          {/* Category filter */}
          {categories.data.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <Link
                href="/articles"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  !category
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-400"
                }`}
              >
                All
              </Link>
              {categories.data.map((c) => (
                <Link
                  key={c.slug}
                  href={`/articles?category=${c.slug}`}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    category === c.slug
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-blue-400"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          {/* A search term needs a way out of itself: with the field up in
              the hero, the only way back to everything was editing the URL
              or scrolling up to clear it by hand. */}
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
                  {meta.total} {meta.total === 1 ? "article" : "articles"}
                </>
              )}
            </p>

            {search && (
              <Link
                href={category ? `/articles?category=${category}` : "/articles"}
                className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
              >
                Clear search
                <X className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-slate-500">No articles here yet.</p>
              <Link
                href="/articles"
                className="mt-3 inline-block text-sm font-semibold text-blue-600"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => (
                <article
                  key={a.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
                >
                  {/*
                    The article's own featured image when it has one, and a
                    photo chosen from its category when it does not. The
                    column has always been on the record and returned by the
                    API — the card simply never read it, so every post
                    looked like a wall of text.
                  */}
                  <Link
                    href={`/articles/${a.slug}`}
                    className="relative block aspect-[16/10] overflow-hidden bg-slate-100"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <img
                      src={articleThumbnail(
                        a.featured_image_path,
                        a.category?.slug ?? null,
                        a.slug,
                      )}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {a.category && (
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {a.category.name}
                        </span>
                      )}
                      {a.is_featured && (
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                      )}
                      {a.is_sponsored && (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          Sponsored
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-bold leading-snug text-slate-900">
                      <Link href={`/articles/${a.slug}`} className="hover:text-blue-600">
                        {a.title}
                      </Link>
                    </h2>

                    {a.excerpt && (
                      <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-500">
                        {a.excerpt}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
                      {a.author && <span className="font-medium">{a.author.name}</span>}
                      <span>{formatDate(a.published_at)}</span>
                      {a.reading_minutes && (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} /> {a.reading_minutes} min
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Eye size={11} /> {a.views_count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <Pagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            hrefFor={pageHref}
            label="Article pages"
            hasResults={items.length > 0}
          />
        </div>
      </main>

      <DarkFooter />
    </>
  );
}
