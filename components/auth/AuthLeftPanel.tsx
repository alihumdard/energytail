import type { ComponentType } from "react";
import RefineryIllustration from "@/components/RefineryIllustration";

interface Perk {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

interface AuthLeftPanelProps {
  title: string;
  subtitle: string;
  perks: Perk[];
  minHeight?: string;
  showDivider?: boolean;
  illustrationHeight?: string;
}

export default function AuthLeftPanel({
  title,
  subtitle,
  perks,
  minHeight = "min-h-[560px]",
  showDivider = false,
  illustrationHeight = "h-44",
}: AuthLeftPanelProps) {
  return (
    <div className={`relative bg-gradient-to-br from-[#0B2B26] to-[#123832] p-6 sm:p-10 flex flex-col overflow-hidden ${minHeight}`}>
      <h1 className="text-3xl font-extrabold text-white">{title}</h1>
      <p className="mt-3 text-slate-300 text-sm leading-relaxed max-w-sm">{subtitle}</p>
      {showDivider && <div className="border-t border-white/10 my-6" />}
      <div className={`space-y-5 relative z-10 ${showDivider ? "" : "mt-8"}`}>
        {perks.map((p) => (
          <div key={p.title} className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <p.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{p.title}</div>
              <div className="text-slate-400 text-sm mt-0.5 leading-relaxed">{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <RefineryIllustration className={`absolute bottom-0 left-0 w-full ${illustrationHeight} pointer-events-none`} />
    </div>
  );
}
