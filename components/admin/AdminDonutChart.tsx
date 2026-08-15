import type { DonutItem } from "@/lib/admin-data";

export default function AdminDonutChart({
  data,
  total,
  totalLabel = "Total",
  size = 168,
}: {
  data: DonutItem[];
  total: number;
  totalLabel?: string;
  size?: number;
}) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offsets = data.map((d) => (d.value / total) * circumference);
  const cumulativeOffsets = offsets.reduce<number[]>(
    (acc, value) => [...acc, acc.length > 0 ? acc[acc.length - 1] + value : 0],
    []
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 160 160" className="-rotate-90 w-full h-full">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="18" />
          {data.map((d, i) => {
            const dash = offsets[i];
            const gap = circumference - dash;
            return (
              <circle
                key={i}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth="18"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-cumulativeOffsets[i]}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{total.toLocaleString()}</span>
          <span className="text-[11.5px] text-slate-400">{totalLabel}</span>
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between text-[12.5px]">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              {d.label}
            </span>
            <span className="text-slate-400">
              {d.value.toLocaleString()} <span className="text-slate-300">({d.pct})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}