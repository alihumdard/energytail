import { Search, Filter, ChevronLeft, ChevronRight, Pencil, MoreVertical, ArrowRight, Lightbulb } from "lucide-react";
import type { RankedItem } from "@/lib/admin-data";

export function AdminStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2 py-1 rounded-md ${
        active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function AdminToolbar({ searchPlaceholder }: { searchPlaceholder: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-4">
      <div className="flex items-center gap-2">
        <select className="text-[13px] border border-slate-200 rounded-lg px-3 h-9 text-slate-600">
          <option>Bulk Actions</option>
          <option>Activate</option>
          <option>Deactivate</option>
          <option>Delete</option>
        </select>
        <button className="text-[13px] font-medium border border-slate-200 rounded-lg px-3.5 h-9 text-slate-500">
          Apply
        </button>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 h-9 w-full sm:w-56">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            className="bg-transparent text-[13px] outline-none flex-1 placeholder:text-slate-400"
            placeholder={searchPlaceholder}
          />
        </div>
        <button className="flex items-center gap-2 border border-slate-200 rounded-lg px-3.5 h-9 text-[13px] font-medium text-slate-600">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>
    </div>
  );
}

export function AdminPagination({ page = 1, totalPages, text }: { page?: number; totalPages: number; text: string }) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
      <div className="text-[12.5px] text-slate-500">Showing {text}</div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 disabled:opacity-40">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`w-8 h-8 rounded-lg text-[12.5px] font-medium flex items-center justify-center ${
              p === page
                ? "bg-blue-600 text-white"
                : "border border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        ))}
        {totalPages > 5 && <span className="text-slate-400 text-sm px-1">...</span>}
        {totalPages > 5 && (
          <button className="w-8 h-8 rounded-lg border border-slate-200 text-[12.5px] font-medium text-slate-500 hover:bg-slate-50">
            {totalPages}
          </button>
        )}
        <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <select className="text-[12.5px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-500">
        <option>10 / page</option>
        <option>25 / page</option>
        <option>50 / page</option>
      </select>
    </div>
  );
}

export function AdminRowActions() {
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function AdminRightCard({
  title,
  icon,
  children,
  footer,
}: {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      {title && (
        <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 mb-4">
          {icon}
          {title}
        </div>
      )}
      {children}
      {footer}
    </div>
  );
}

export function AdminTopList({
  title,
  items,
  footerLabel,
}: {
  title: string;
  items: RankedItem[];
  footerLabel?: string;
}) {
  return (
    <AdminRightCard title={title}>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between">
            <span className="text-[13px] text-slate-600 flex items-center gap-2">
              {item.rank && (
                <span className="w-4 text-[11px] font-semibold text-slate-400">{item.rank}</span>
              )}
              {item.label}
            </span>
            <span className="text-[13px] font-semibold text-slate-900">{item.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
      {footerLabel && (
        <button className="mt-4 text-[12.5px] font-semibold text-blue-600 flex items-center gap-1">
          {footerLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </AdminRightCard>
  );
}

export function AdminQuickTips({ tips }: { tips: string[] }) {
  return (
    <AdminRightCard title="Quick Tips" icon={<Lightbulb className="w-4 h-4 text-blue-600" />}>
      <ul className="space-y-2.5">
        {tips.map((tip, i) => (
          <li key={i} className="flex gap-2 text-[12.5px] text-slate-500 leading-relaxed">
            <span className="w-1 h-1 rounded-full bg-slate-300 mt-2 shrink-0" />
            {tip}
          </li>
        ))}
      </ul>
    </AdminRightCard>
  );
}