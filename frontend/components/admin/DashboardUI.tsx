"use client";

import Link from "next/link";
import { ChevronRight, ArrowUp, ArrowDown } from "lucide-react";

export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {item.href ? (
            <Link href={item.href} className="hover:text-blue-600">
              {item.label}
            </Link>
          ) : (
            <span className={i === items.length - 1 ? "text-gray-500" : ""}>
              {item.label}
            </span>
          )}
          {i < items.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
        </span>
      ))}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  delta,
  deltaUp,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  delta?: string;
  deltaUp?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
      </div>
      {delta && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium">
          <span
            className={`flex items-center gap-0.5 ${
              deltaUp ? "text-green-600" : "text-red-500"
            }`}
          >
            {deltaUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {delta}
          </span>
          <span className="text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  Published: "bg-green-50 text-green-600",
  Active: "bg-green-50 text-green-600",
  Draft: "bg-gray-100 text-gray-500",
  Expired: "bg-red-50 text-red-500",
  Closed: "bg-gray-100 text-gray-500",
  Pending: "bg-orange-50 text-orange-500",
  "Pending Review": "bg-orange-50 text-orange-500",
  Suspended: "bg-red-50 text-red-500",
  Inactive: "bg-gray-100 text-gray-400",
};

const dotStyles: Record<string, string> = {
  Published: "bg-green-500",
  Active: "bg-green-500",
  Draft: "bg-gray-400",
  Expired: "bg-red-500",
  Closed: "bg-gray-400",
  Pending: "bg-orange-500",
  "Pending Review": "bg-orange-500",
  Suspended: "bg-red-500",
  Inactive: "bg-gray-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
        statusStyles[status] ?? "bg-gray-100 text-gray-500"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status] ?? "bg-gray-400"}`} />
      {status}
    </span>
  );
}

export function DonutChart({
  data,
  total,
  totalLabel,
}: {
  data: { label: string; value: number; pct: number; color: string }[];
  total: number;
  totalLabel: string;
}) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const segments = data.reduce<{ dash: number; offset: number; color: string }[]>(
    (acc, d) => {
      const cumulative = acc.reduce((sum, s) => sum + s.dash, 0);
      const dash = (d.pct / 100) * circumference;
      acc.push({ dash, offset: cumulative, color: d.color });
      return acc;
    },
    []
  );

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[180px] h-[180px]">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          {segments.map((seg, i) => {
            const { dash, offset, color } = seg;
            return (
              <circle
                key={i}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="18"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{totalLabel}</p>
        </div>
      </div>
    </div>
  );
}
