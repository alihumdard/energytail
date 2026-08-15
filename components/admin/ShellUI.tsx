import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-gray-500">
      {items.map((item, idx) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {idx > 0 && <ChevronRight size={13} className="text-gray-300" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-brand-600">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-500">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  title,
  breadcrumb,
  description,
  actions,
}: {
  title: string;
  breadcrumb: { label: string; href?: string }[];
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-gray-900">
          {title}
        </h1>
        <div className="mt-1.5">
          <Breadcrumb items={breadcrumb} />
        </div>
        {description && (
          <p className="mt-2 text-[13.5px] text-gray-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

const badgeStyles: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  gray: "bg-gray-100 text-gray-600",
  teal: "bg-teal-100 text-teal-700",
  indigo: "bg-indigo-100 text-indigo-700",
};

export function Badge({
  children,
  color = "gray",
  dot = false,
  className = "",
}: {
  children: React.ReactNode;
  color?: keyof typeof badgeStyles;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ${badgeStyles[color]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${badgeStyles[color]
            .split(" ")[1]
            .replace("text-", "bg-")}`}
        />
      )}
      {children}
    </span>
  );
}

export function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  meta,
  metaColor = "text-gray-400",
}: {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string | number;
  meta?: string;
  metaColor?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon size={19} className={iconColor} />
        </span>
      </div>
      <p className="mt-3 text-[22px] font-bold leading-none text-gray-900">
        {value}
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-gray-600">{label}</p>
      {meta && <p className={`mt-1 text-[12px] ${metaColor}`}>{meta}</p>}
    </div>
  );
}

export function IconButton({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label?: string;
}) {
  return (
    <button
      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      aria-label={label}
    >
      <Icon size={16} />
    </button>
  );
}
