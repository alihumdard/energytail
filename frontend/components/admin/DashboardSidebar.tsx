"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  Grid3x3,
  Factory,
  Globe,
  MapPin,
  Wrench,
  Tag,
  Shield,
  Settings,
  ScrollText,
  Link2,
  Eye,
  Trash2,
  ChevronDown,
} from "lucide-react";

const mainNav = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Companies", href: "/admin/companies", icon: Building2 },
  { label: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { label: "Articles", href: "/admin/articles", icon: FileText },
];

const managementNav = [
  { label: "Job Categories", href: "/admin/job-categories", icon: Grid3x3 },
  { label: "Industries", href: "/admin/industries", icon: Factory },
  { label: "Countries", href: "/admin/countries", icon: Globe },
  { label: "Cities", href: "/admin/cities", icon: MapPin },
  { label: "Skills", href: "/admin/skills", icon: Wrench },
  { label: "Tags", href: "/admin/tags", icon: Tag },
];

const systemNav = [
  { label: "Roles & Permissions", href: "/admin/roles-permissions", icon: Shield },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
];

function NavSection({
  title,
  items,
  pathname,
}: {
  title?: string;
  items: { label: string; href: string; icon: React.ElementType }[];
  pathname: string;
}) {
  return (
    <div className="mb-6">
      {title && (
        <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-gray-400">
          {title}
        </p>
      )}
      <nav className="space-y-0.5">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function DashboardSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-200 shrink-0">
          <img src="/logo.png" alt="Energy Tail" className="h-8 w-auto object-contain" />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pt-4">
          <NavSection items={mainNav} pathname={pathname} />
          <NavSection title="MANAGEMENT" items={managementNav} pathname={pathname} />
          <NavSection title="SYSTEM" items={systemNav} pathname={pathname} />
        </div>

        <div className="shrink-0 border-t border-gray-200 p-3">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center text-sm font-semibold text-gray-600">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                Super Admin
              </p>
              <p className="text-xs text-gray-400 truncate">
                admin@energytail.com
              </p>
            </div>
            <ChevronDown size={16} className="text-gray-400 shrink-0" />
          </div>

          <div className="mt-3 rounded-lg bg-gray-50 p-3">
            <p className="text-[11px] font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <Link2 size={12} /> QUICK LINKS
            </p>
            <div className="space-y-1.5">
              <button className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-blue-600 px-1">
                <span className="flex items-center gap-2">
                  <Eye size={14} /> View Site
                </span>
              </button>
              <button className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-blue-600 px-1">
                <span className="flex items-center gap-2">
                  <Trash2 size={14} /> Clear Cache
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
