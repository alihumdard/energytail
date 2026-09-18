import type { MetadataRoute } from "next";
import { fetchPublic } from "@/lib/api/server";
import { SITE_URL } from "@/lib/seo/site";

/**
 * The XML sitemap, served by Next at /sitemap.xml.
 *
 * Everything comes from one backend call that returns slugs and timestamps
 * only. That endpoint applies the same visibility scopes as the pages
 * themselves, so a draft, expired or suspended record can never be
 * advertised here.
 */

interface SitemapEntry {
  slug: string;
  updated_at: string | null;
}

interface SitemapPayload {
  jobs: SitemapEntry[];
  companies: SitemapEntry[];
  articles: SitemapEntry[];
  taxonomies: {
    countries: string[];
    cities: string[];
    categories: string[];
    industries: string[];
    article_categories: string[];
  };
}

/**
 * Rebuilt hourly. A job posted now should be findable today, but a crawler
 * hitting this must not turn into a database scan per request.
 */
export const revalidate = 3600;

/** Static pages worth crawling. Anything behind a login is deliberately absent. */
const staticPaths: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/jobs", priority: 0.9, changeFrequency: "hourly" },
  { path: "/companies", priority: 0.8, changeFrequency: "daily" },
  { path: "/articles", priority: 0.8, changeFrequency: "daily" },
  { path: "/pricing", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((entry) => ({
    url: `${SITE_URL}${entry.path}`,
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  let payload: SitemapPayload;

  try {
    ({ data: payload } = await fetchPublic<{ data: SitemapPayload }>("/sitemap", {
      revalidate,
    }));
  } catch {
    /*
     * If the API is down, serve the static pages rather than a 500. An
     * incomplete sitemap costs a crawl cycle; an erroring one can get the
     * sitemap dropped altogether.
     */
    return staticEntries;
  }

  const detail = (
    items: SitemapEntry[],
    prefix: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  ): MetadataRoute.Sitemap =>
    items.map((item) => ({
      url: `${SITE_URL}${prefix}/${item.slug}`,
      lastModified: item.updated_at ? new Date(item.updated_at) : now,
      changeFrequency,
      priority,
    }));

  /*
   * Filtered searches, which are the "jobs in Norway" / "drilling jobs"
   * landing pages the plan asks for. /jobs already reads these as query
   * parameters and renders server-side, so they are real indexable pages
   * rather than routes that would have to be invented.
   *
   * The backend only returns taxonomies that currently have a live job, so
   * none of these lands on an empty result set.
   */
  const filters: MetadataRoute.Sitemap = (
    [
      ["country", payload.taxonomies.countries],
      ["city", payload.taxonomies.cities],
      ["category", payload.taxonomies.categories],
      ["industry", payload.taxonomies.industries],
    ] as const
  ).flatMap(([param, slugs]) =>
    slugs.map((slug) => ({
      url: `${SITE_URL}/jobs?${param}=${encodeURIComponent(slug)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  );

  return [
    ...staticEntries,
    ...detail(payload.jobs, "/jobs", 0.8, "weekly"),
    ...detail(payload.companies, "/companies", 0.7, "weekly"),
    ...detail(payload.articles, "/articles", 0.7, "monthly"),
    ...filters,
    ...payload.taxonomies.article_categories.map((slug) => ({
      url: `${SITE_URL}/articles?category=${encodeURIComponent(slug)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
