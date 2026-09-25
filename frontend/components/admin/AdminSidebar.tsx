"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Logo from "@/components/Logo";
import { subscribe, getOpen, setOpen } from "./drawer-store";
import {
  Home,
  Users as UsersIcon,
  Building2,
  Briefcase,
  FileText,
  MessageSquare,
  LayoutGrid,
  Factory,
  Globe,
  MapPin,
  Wrench,
  Tag,
  Shield,
  Settings,
  ClipboardList,
  ExternalLink,
  Activity,
} from "lucide-react";
import UserMenu from "./UserMenu";

export type AdminNavKey =
  | "dashboard"
  | "users"
  | "companies"
  | "jobs"
  | "articles"
  | "comments"
  | "categories"
  | "industries"
  | "countries"
  | "cities"
  | "skills"
  | "tags"
  | "roles"
  | "settings"
  | "audit-logs";

/**
 * A sidebar entry, and the permission that earns it.
 *
 * The permission is the whole point: the nav is built from what the signed-in
 * account can actually do, so a role without `users.view` never sees a Users
 * link that would 403 the moment they clicked it. The API is still the
 * boundary — this only stops the menu promising something it cannot deliver.
 */
type NavItem = {
  key: AdminNavKey;
  label: string;
  href: string;
  icon: typeof Home;
  permission: string;
};

const mainNav: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
    permission: "dashboard.view",
  },
  {
    key: "users",
    label: "Users",
    href: "/admin/users",
    icon: UsersIcon,
    permission: "users.view",
  },
  {
    key: "companies",
    label: "Companies",
    href: "/admin/companies",
    icon: Building2,
    permission: "companies.approve",
  },
  {
    key: "jobs",
    label: "Jobs",
    href: "/admin/jobs",
    icon: Briefcase,
    permission: "jobs.approve",
  },
  {
    key: "articles",
    label: "Articles",
    href: "/admin/articles",
    icon: FileText,
    permission: "articles.approve",
  },
  {
    key: "comments",
    label: "Comments",
    href: "/admin/comments",
    icon: MessageSquare,
    permission: "comments.approve",
  },
];

const managementNav: NavItem[] = [
  {
    key: "categories",
    label: "Job Categories",
    href: "/admin/job-categories",
    icon: LayoutGrid,
    permission: "taxonomy.view",
  },
  {
    key: "industries",
    label: "Industries",
    href: "/admin/industries",
    icon: Factory,
    permission: "taxonomy.view",
  },
  {
    key: "countries",
    label: "Countries",
    href: "/admin/countries",
    icon: Globe,
    permission: "taxonomy.view",
  },
  {
    key: "cities",
    label: "Cities",
    href: "/admin/cities",
    icon: MapPin,
    permission: "taxonomy.view",
  },
  {
    key: "skills",
    label: "Skills",
    href: "/admin/skills",
    icon: Wrench,
    permission: "taxonomy.view",
  },
  {
    key: "tags",
    label: "Tags",
    href: "/admin/tags",
    icon: Tag,
    permission: "taxonomy.view",
  },
];

const systemNav: NavItem[] = [
  {
    key: "roles",
    label: "Roles & Permissions",
    href: "/admin/roles-permissions",
    icon: Shield,
    permission: "roles.view",
  },
  {
    key: "settings",
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    permission: "settings.view",
  },
  {
    key: "audit-logs",
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: ClipboardList,
    permission: "audit_logs.view",
  },
];

function NavSection({
  title,
  items,
  active,
}: {
  title: string;
  items: NavItem[];
  active: AdminNavKey;
}) {
  // A section with nothing the user may open renders nothing at all —
  // a lone heading over empty space reads as something failing to load.
  if (items.length === 0) return null;

  return (
    <div>
      <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-400">
        {title}
      </div>
      <div className="mt-2 space-y-0.5">
        {items.map((item) => {
          const isActive = item.key === active;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SidebarInner({ active }: { active: AdminNavKey }) {
  const { can } = useAuth();

  // Built from what this account can actually do, so no link here leads to
  // a screen the API would refuse.
  const allowed = (items: NavItem[]) =>
    items.filter((item) => can(item.permission));

  return (
    <>
      <div className="h-[65px] flex items-center gap-2.5 px-5 border-b border-slate-100 shrink-0">
        {/* The shared component, not another <img>: the admin sidebar was
            the last place still naming the file itself, which is how the
            logo drifted out of step here before. */}
        <Logo size="compact" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <NavSection title="MAIN" items={allowed(mainNav)} active={active} />
        <NavSection
          title="MANAGEMENT"
          items={allowed(managementNav)}
          active={active}
        />
        <NavSection title="SYSTEM" items={allowed(systemNav)} active={active} />
      </nav>

      <div className="border-t border-slate-100 px-3 pt-2.5 pb-3 space-y-3 shrink-0">
        <UserMenu align="left" showEmail />

        <div className="rounded-lg border border-slate-100 p-2.5">
          <div className="text-[11px] font-semibold text-slate-400 px-1 mb-1.5">
            Quick Links
          </div>
          <Link
            href="/"
            className="flex items-center justify-between px-1.5 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-50"
          >
            View Site
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <Link
            href="/admin/audit-logs"
            className="flex items-center justify-between px-1.5 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-50"
          >
            Audit Logs
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
          </Link>
        </div>
      </div>
    </>
  );
}

export default function AdminSidebar({
  active,
  sticky = true,
}: {
  active: AdminNavKey;
  sticky?: boolean;
}) {
  const open = useSyncExternalStore(subscribe, getOpen, getOpen);

  return (
    <>
      <aside
        className={`hidden lg:flex w-64 shrink-0 border-r border-slate-100 bg-white flex-col ${
          sticky ? "h-screen sticky top-0" : "self-start"
        }`}
      >
        <SidebarInner active={active} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-white shadow-xl">
            <button
              className="absolute right-3 top-[22px] z-10 rounded-lg p-1.5 text-slate-500 hover:bg-slate-50"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarInner active={active} />
          </aside>
        </div>
      )}
    </>
  );
}
