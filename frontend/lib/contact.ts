/**
 * Contact details and social profiles, in one place.
 *
 * These appear in the utility bar, the footer, the legal pages and the
 * structured data a crawler reads. Kept together so changing the contact
 * address is one edit rather than a search across the codebase — which is
 * how the footer ended up pointing its social icons at "#" while the bar
 * above it showed an address nothing else used.
 */
interface Site {
  email: string;
  phone: string;
  /** null where there is no profile yet — see the note below. */
  social: Record<
    "linkedin" | "facebook" | "twitter" | "instagram" | "youtube",
    string | null
  >;
}

export const SITE: Site = {
  email: "info.energytail@gmail.com",
  phone: "+971 50 123 4567",

  social: {
    linkedin: "https://www.linkedin.com/company/energy-tail/",
    // No page yet. A link to "#" scrolls to the top of the page and reads
    // as broken, so the icon is rendered without one until there is
    // somewhere for it to go.
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
  },
};

/** Every social profile that actually exists, for structured data. */
export const SOCIAL_PROFILE_URLS: string[] = Object.values(SITE.social).filter(
  (url): url is string => url !== null,
);
