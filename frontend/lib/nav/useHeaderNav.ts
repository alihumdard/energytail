"use client";

import { useAuth } from "@/lib/auth/AuthProvider";

export type HeaderNavItem = { label: string; href: string };

/**
 * The public navigation.
 *
 * Only routes that exist are listed. Categories and Locations used to point
 * at /admin/job-categories and /admin/countries — admin-only screens reached
 * from the public header — and Packages/About Us went to placeholders.
 */
export const publicNavItems: HeaderNavItem[] = [
  { label: "Jobs", href: "/jobs" },
  { label: "Companies", href: "/companies" },
  { label: "Articles", href: "/articles" },
  { label: "Pricing", href: "/pricing" },
];

export interface HeaderNav {
  /** The signed-in user, or null. */
  user: ReturnType<typeof useAuth>["user"];
  /** True until the session check finishes — render neither state yet. */
  loading: boolean;
  /** Whether to show the signed-in controls. */
  isAuthenticated: boolean;
  /** Where this user's dashboard lives. */
  dashboardHref: string;
  /** Whether this user may post a job at all. */
  canPost: boolean;
  /** Where "Post a Job" should lead, given who is asking. */
  postJobHref: string;
  navItems: HeaderNavItem[];
}

/**
 * One source of truth for what the header shows.
 *
 * Three separate headers (Header, HeaderAlt, SiteHeader) each hardcoded
 * Login/Register and never consulted the session, so a signed-in user was
 * invited to log in again on every page. Sharing the decision here keeps
 * them from drifting apart again.
 */
export function useHeaderNav(): HeaderNav {
  const { user, loading } = useAuth();

  const roles = user?.roles ?? [];
  const canPost = roles.includes("administrator") || roles.includes("employer");

  const dashboardHref = roles.includes("administrator")
    ? "/admin/dashboard"
    : roles.includes("employer")
      ? "/employer-dashboard"
      : roles.includes("author")
        ? "/author-dashboard"
        : "/dashboard";

  return {
    user,
    loading,
    isAuthenticated: user !== null,
    dashboardHref,
    canPost,
    // A guest who wants to post needs an employer account first; a seeker
    // signed in on the wrong kind of account needs one too.
    postJobHref: canPost ? "/employer/jobs/new" : "/register?role=employer",
    navItems: publicNavItems,
  };
}
