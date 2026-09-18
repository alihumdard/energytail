import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

/**
 * robots.txt, served by Next at /robots.txt.
 *
 * Everything public is crawlable; the signed-in areas are not. Those pages
 * already require a session and would render as a redirect to a crawler, but
 * disallowing them keeps them out of the crawl budget entirely rather than
 * spending it on doors that do not open.
 *
 * This is not a security control — robots.txt is a request, and it is public.
 * Authorisation is enforced on the API.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/employer/",
        "/author/",
        "/employer-dashboard",
        "/author-dashboard",
        "/dashboard",
        "/profile",
        "/saved-jobs",
        "/job-alerts",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        // Single-use token links. Indexing one would publish the token.
        "/newsletter/confirm",
        "/auth/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
