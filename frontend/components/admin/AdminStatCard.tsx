import type { LucideIcon } from "lucide-react";

const tones = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  orange: "bg-orange-50 text-orange-600",
  purple: "bg-violet-50 text-violet-600",
} as const;

export default function AdminStatCard({
  icon: Icon,
  tone = "blue",
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  tone?: keyof typeof tones;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className={`w-10 h-10 rounded-lg ${tones[tone]} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="mt-3 text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-0.5">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}