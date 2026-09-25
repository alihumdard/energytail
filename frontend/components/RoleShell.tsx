"use client";

import { usePathname } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { SHELL_COPY, sectionsFor } from "@/lib/navigation";

/**
 * The dashboard chrome, for any page behind a role's sidebar.
 *
 * DashboardShell takes its navigation, search copy and plan card as props,
 * which meant every page that wanted the sidebar had to restate all of
 * them — so in practice only the three dashboard landing pages did, and
 * every screen they linked to fell back to the public site header. Reaching
 * "Write Article" from the author dashboard looked like leaving the
 * dashboard entirely.
 *
 * This asks for the role and reads the rest, including which entry to
 * highlight, from the current path.
 */
export default function RoleShell({
  role,
  children,
}: {
  role: "seeker" | "employer" | "author";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const copy = SHELL_COPY[role];

  return (
    <DashboardShell
      sections={sectionsFor(role, pathname)}
      searchPlaceholder={copy.searchPlaceholder}
      searchTypeLabel={copy.searchTypeLabel}
      planTitle={copy.planTitle}
      planBody={copy.planBody}
    >
      {children}
    </DashboardShell>
  );
}
