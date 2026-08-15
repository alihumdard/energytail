import type { ComponentType } from "react";

interface Provider {
  label: string;
  icon: ComponentType<{ className?: string }>;
  iconClassName?: string;
}

export default function SocialAuthButtons({
  providers,
  columns = 2,
}: {
  providers: Provider[];
  columns?: number;
}) {
  const gridClass = columns === 3 ? "grid-cols-3 max-sm:gap-1.5" : "grid-cols-2";
  return (
    <div className={`grid ${gridClass} gap-3`}>
      {providers.map((p) => (
        <button
          key={p.label}
          type="button"
          className="flex items-center justify-center gap-1.5 border border-slate-200 rounded-lg py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <p.icon className={`w-4 h-4 shrink-0 ${p.iconClassName ?? ""}`} />
          <span className="max-sm:hidden">{p.label}</span>
        </button>
      ))}
    </div>
  );
}
