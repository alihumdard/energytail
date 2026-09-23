import {
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  CreditCard,
  FileEdit,
  FileText,
  Home,
  PenLine,
  PlusCircle,
  Search,
  UserCircle,
} from "lucide-react";
import type { NavSection } from "@/components/DashboardShell";

/**
 * The dashboard sidebar, per role.
 *
 * Defined here rather than in each page because every screen behind the
 * sidebar renders it — a dozen of them — and a copy per page means a link
 * added to one is missing from the rest. It also means the nav was
 * unreachable from those pages at all, which is why following any sidebar
 * link used to drop the reader back onto the public site header.
 *
 * Nothing here marks itself active: that depends on which page is showing,
 * so it is applied by sectionsFor() from the current path.
 */

type Role = "seeker" | "employer" | "author";

const SECTIONS: Record<Role, NavSection[]> = {
  seeker: [
    {
      title: "MAIN",
      items: [
        { label: "Dashboard", icon: Home, href: "/dashboard", permission: "dashboard.view" },
        { label: "Saved Jobs", icon: Bookmark, href: "/saved-jobs", permission: "jobs.view" },
        { label: "Job Alerts", icon: Bell, href: "/job-alerts", permission: "jobs.view" },
        { label: "Find Jobs", icon: Search, href: "/jobs" },
        {
          label: "Companies",
          icon: Briefcase,
          href: "/companies",
          permission: "companies.view",
        },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        // The profile is where a seeker's applications are judged from, and
        // it had no entry in the sidebar at all.
        { label: "My Profile", icon: UserCircle, href: "/profile" },
      ],
    },
  ],

  employer: [
    {
      title: "MAIN",
      items: [
        {
          label: "Dashboard",
          icon: Home,
          href: "/employer-dashboard",
          permission: "dashboard.view",
        },
        { label: "Post a Job", icon: PlusCircle, href: "/employer/jobs/new", permission: "jobs.add" },
        {
          label: "Jobs Management",
          icon: Briefcase,
          href: "/employer/jobs",
          permission: "jobs.view",
        },
        { label: "Browse Jobs", icon: FileText, href: "/jobs" },
      ],
    },
    {
      title: "COMPANY",
      items: [
        {
          label: "Company Profile",
          icon: Building2,
          href: "/employer/company-profile",
          permission: "companies.view",
        },
        {
          label: "Billing",
          icon: CreditCard,
          href: "/employer/billing",
          permission: "companies.edit",
        },
      ],
    },
  ],

  author: [
    {
      title: "MAIN",
      items: [
        {
          label: "Dashboard",
          icon: Home,
          href: "/author-dashboard",
          permission: "dashboard.view",
        },
        {
          label: "My Articles",
          icon: FileText,
          href: "/author/articles",
          permission: "articles.view",
        },
        {
          label: "Write Article",
          icon: PenLine,
          href: "/author/articles/new",
          permission: "articles.add",
        },
        { label: "Read the Feed", icon: FileEdit, href: "/articles" },
      ],
    },
  ],
};

/**
 * Whether a nav entry should be highlighted for the page being shown.
 *
 * An exact match, plus a prefix match for entries that own a subtree — so
 * editing an article keeps "My Articles" lit. "Write Article" and the
 * dashboards are excluded from prefix matching: /author/articles/new sits
 * under /author/articles, and both would otherwise light up at once.
 */
function isActive(href: string, pathname: string): boolean {
  if (href === pathname) return true;

  const ownsSubtree = ["/author/articles", "/employer/jobs"];

  return ownsSubtree.some(
    (root) =>
      href === root &&
      pathname.startsWith(`${root}/`) &&
      // A "new" page is its own entry, not a child of the list.
      !pathname.endsWith("/new"),
  );
}

/**
 * The sidebar for a role, with the entry matching `pathname` marked active.
 */
export function sectionsFor(role: Role, pathname: string): NavSection[] {
  return SECTIONS[role].map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      active: isActive(item.href, pathname),
    })),
  }));
}

/** Search placeholder and plan copy, which differ per role. */
export const SHELL_COPY: Record<
  Role,
  {
    searchPlaceholder: string;
    searchTypeLabel: string;
    planTitle: string;
    planBody: string;
  }
> = {
  seeker: {
    searchPlaceholder: "Search jobs, companies...",
    searchTypeLabel: "Jobs",
    planTitle: "Get Noticed",
    planBody: "Complete your profile so employers can see who you are.",
  },
  employer: {
    searchPlaceholder: "Search jobs, candidates, companies...",
    searchTypeLabel: "Jobs",
    planTitle: "Upgrade Your Plan",
    planBody:
      "Get more visibility and better candidates by upgrading your subscription.",
  },
  author: {
    searchPlaceholder: "Search your articles...",
    searchTypeLabel: "Articles",
    planTitle: "Write for Energy Tail",
    planBody: "Share your expertise with oil, gas and renewable energy professionals.",
  },
};
