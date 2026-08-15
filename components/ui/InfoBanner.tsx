import type { ReactNode } from "react";

interface InfoBannerProps {
  icon: ReactNode;
  iconVariant?: "circle" | "plain";
  iconWrapClass?: string;
  title: string;
  desc?: string;
  action?: ReactNode;
  className?: string;
}

export default function InfoBanner({
  icon,
  iconVariant = "circle",
  iconWrapClass = "bg-blue-600",
  title,
  desc,
  action,
  className = "",
}: InfoBannerProps) {
  return (
    <section className={`rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      <div className={`flex items-center ${iconVariant === "circle" ? "gap-4" : "gap-3"}`}>
        {iconVariant === "circle" ? (
          <div className={`w-11 h-11 rounded-full ${iconWrapClass} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
        ) : (
          icon
        )}
        <div>
          <div className="font-semibold text-slate-800 text-sm">{title}</div>
          {desc && <div className="text-xs text-slate-500 mt-0.5">{desc}</div>}
        </div>
      </div>
      {action}
    </section>
  );
}
