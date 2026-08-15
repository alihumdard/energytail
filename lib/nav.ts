import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  LayoutGrid,
  Factory,
  Globe,
  MapPin,
  Link2,
  Tag,
  ShieldCheck,
  Settings,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Companies", href: "/admin/companies", icon: Building2 },
      { label: "Jobs", href: "/admin/jobs", icon: Briefcase },
      { label: "Articles", href: "/admin/articles", icon: FileText },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Job Categories", href: "/admin/job-categories", icon: LayoutGrid },
      { label: "Industries", href: "/admin/industries", icon: Factory },
      { label: "Countries", href: "/admin/countries", icon: Globe },
      { label: "Cities", href: "/admin/cities", icon: MapPin },
      { label: "Skills", href: "/admin/skills", icon: Link2 },
      { label: "Tags", href: "/admin/tags", icon: Tag },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Roles & Permissions", href: "/admin/roles-permissions", icon: ShieldCheck },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
    ],
  },
];
