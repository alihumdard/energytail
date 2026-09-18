/**
 * One source of truth for the site's own identity.
 *
 * Canonical URLs, sitemap entries and structured data all have to agree on
 * where the site lives. Reading the origin in each place separately is how
 * they drift, and a canonical that disagrees with the sitemap tells a crawler
 * two different things about the same page.
 */

/**
 * The public origin, with no trailing slash.
 *
 * Falls back to localhost so a developer without the variable set gets a
 * working site rather than URLs beginning "undefined/". In production this
 * must be the real domain: a canonical tag pointing at localhost would ask
 * Google to index an address it cannot reach.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_NAME = "Energy Tail";

export const SITE_DESCRIPTION =
  "Oil, gas and energy jobs from employers hiring across drilling, subsea, " +
  "renewables and HSE. Search openings, follow companies and read industry news.";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
