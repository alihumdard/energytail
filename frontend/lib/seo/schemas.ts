import type {
  BreadcrumbList,
  Organization,
  BlogPosting,
  WebSite,
  WithContext,
} from "schema-dts";
import type { PublicArticle, PublicCompany } from "@/lib/api/types";
import { SOCIAL_PROFILE_URLS } from "@/lib/contact";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "./site";

/**
 * The site itself, emitted once on the homepage.
 *
 * The SearchAction is what lets a search engine offer a search box for the
 * site directly in its results. It has to name a URL template the site
 * genuinely answers — /jobs?search= is the real query parameter, not an
 * aspirational one.
 */
export function websiteSchema(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    // Ties the site to the profiles that represent it, so a search engine
    // can show them as the same entity rather than guessing.
    sameAs: SOCIAL_PROFILE_URLS,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/jobs?search={search_term_string}`,
      },
      // schema-dts types this loosely; the name is what Google reads.
      "query-input": "required name=search_term_string",
    } as WithContext<WebSite>["potentialAction"],
  };
}

/** An employer's profile page. */
export function organizationSchema(company: PublicCompany): WithContext<Organization> {
  const schema: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: absoluteUrl(`/companies/${company.slug}`),
  };

  if (company.description) schema.description = company.description;
  if (company.website) schema.sameAs = [company.website];
  if (company.founded_year) schema.foundingDate = String(company.founded_year);

  if (company.country || company.city) {
    schema.address = {
      "@type": "PostalAddress",
      ...(company.city ? { addressLocality: company.city.name } : {}),
      ...(company.country
        ? { addressRegion: company.country.name, addressCountry: company.country.code }
        : {}),
      ...(company.address ? { streetAddress: company.address } : {}),
    };
  }

  /*
   * Social profiles strengthen the entity match, so they join the website in
   * sameAs rather than replacing it.
   */
  const socials = company.socials?.map((s) => s.url).filter(Boolean) ?? [];
  if (socials.length > 0) {
    schema.sameAs = [...(company.website ? [company.website] : []), ...socials];
  }

  return schema;
}

/** An article. BlogPosting rather than Article — these are editorial posts. */
export function articleSchema(article: PublicArticle): WithContext<BlogPosting> {
  const schema: WithContext<BlogPosting> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    url: absoluteUrl(`/articles/${article.slug}`),
    mainEntityOfPage: absoluteUrl(`/articles/${article.slug}`),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  if (article.excerpt) schema.description = article.excerpt;
  if (article.published_at) schema.datePublished = article.published_at;
  if (article.author) schema.author = { "@type": "Person", name: article.author.name };
  if (article.category) schema.articleSection = article.category.name;

  return schema;
}

/**
 * Breadcrumbs, which render as the path above a search result instead of a
 * bare URL.
 *
 * Positions are 1-based and must be contiguous, so the trail is built as a
 * whole here rather than assembled ad hoc per page.
 */
export function breadcrumbSchema(
  trail: { name: string; path: string }[],
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}
