/**
 * Thumbnail imagery for cards whose record has no image of its own.
 *
 * Jobs have no image column, and no article on file has filled
 * featured_image_path yet, so a card that shows only what the database holds
 * shows nothing. These give every card a picture while the real ones are
 * still missing, without inventing a per-record image the record does not
 * have: the photo is chosen from the job's category, so every drilling role
 * looks like drilling and the same job never changes picture between two
 * page loads.
 *
 * Fixed Unsplash ids rather than a random endpoint, for the same reason the
 * homepage uses them: a URL that returns a different photo on each request
 * defeats caching and makes the page flicker as it revalidates.
 */

/** Sized for a card, not a hero — these are served at roughly 400x260. */
const CARD = "w=640&h=420&fit=crop&q=70";

/**
 * A photo per top-level job category, keyed by the slugs the taxonomy
 * seeder creates. A category added later falls back to GENERIC rather than
 * needing this map updated before it can be displayed.
 */
const CATEGORY_PHOTOS: Record<string, string> = {
  engineering: "photo-1581091226825-a6a2a5aee158",
  "drilling-well-operations": "photo-1518709268805-4e9042af2176",
  "production-operations": "photo-1504328345606-18bbc8c9d7d1",
  "hse-environmental": "photo-1581092160607-ee22621dd758",
  "pipeline-engineering-operations": "photo-1547683905-f686c993aae5",
  "instrument-technicians": "photo-1518770660439-4636190af475",
  "geoscience-exploration": "photo-1446776877081-d282a0f896e2",
  "projects-procurement-supply-chain": "photo-1494412574643-ff11b0a5c1c3",
};

/** Used when a job has no category, or one this map has not met. */
const GENERIC_PHOTOS = [
  "photo-1497440001374-f26997328c1b",
  "photo-1473341304170-971dccb5ac1e",
  "photo-1465101162946-4377e57745c3",
  "photo-1509391366360-2e959784a276",
];

/** Stable per-key index, so the same job always gets the same photo. */
function hashIndex(key: string, length: number): number {
  let hash = 0;

  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }

  return hash % length;
}

function unsplash(id: string): string {
  return `https://images.unsplash.com/${id}?${CARD}`;
}

/**
 * A thumbnail for a job card.
 *
 * `categorySlug` picks the subject; `key` (the job slug) only decides which
 * generic photo stands in when the category is unknown, so two uncategorised
 * jobs do not look like the same posting.
 */
export function jobThumbnail(categorySlug: string | null, key: string): string {
  const byCategory = categorySlug ? CATEGORY_PHOTOS[categorySlug] : undefined;

  return unsplash(byCategory ?? GENERIC_PHOTOS[hashIndex(key, GENERIC_PHOTOS.length)]);
}

/**
 * A thumbnail for an article card.
 *
 * Prefers the article's own featured image — unlike jobs, articles have a
 * column for one, so a real upload must win over the stand-in.
 */
export function articleThumbnail(
  featuredImagePath: string | null,
  categorySlug: string | null,
  key: string,
): string {
  if (featuredImagePath) return resolveUpload(featuredImagePath);

  const byCategory = categorySlug ? ARTICLE_PHOTOS[categorySlug] : undefined;

  return unsplash(byCategory ?? GENERIC_PHOTOS[hashIndex(key, GENERIC_PHOTOS.length)]);
}

/** A photo per article category, mirroring the job map above. */
const ARTICLE_PHOTOS: Record<string, string> = {
  "oil-gas-articles": "photo-1505027082971-a5e04d1a1a1e",
  "renewable-energy-articles": "photo-1497440001374-f26997328c1b",
  "lng-articles": "photo-1518709268805-4e9042af2176",
  "hse-articles": "photo-1581092160607-ee22621dd758",
  "solar-energy-articles": "photo-1509391366360-2e959784a276",
  "power-generation-articles": "photo-1473341304170-971dccb5ac1e",
  "technology-articles": "photo-1518770660439-4636190af475",
  "careers-advice-articles": "photo-1521791136064-7986c2920216",
  "market-insights-articles": "photo-1611974789855-9c2a0a7236a3",
};

/**
 * An uploaded path as a URL the browser can load.
 *
 * Stored paths are relative to the API's public disk; an absolute URL is
 * already resolved and passes through untouched.
 */
export function resolveUpload(path: string): string {
  if (/^https?:\/\//.test(path)) return path;

  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}/storage/${path.replace(/^\/?storage\//, "")}`;
}
