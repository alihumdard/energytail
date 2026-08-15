import { Plus } from "lucide-react";

export default function AdminPageHeader({
  crumbs,
  title,
  addLabel,
}: {
  crumbs: string[];
  title: string;
  addLabel?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {crumbs.map((c, i) => (
            <span key={c}>
              {i > 0 && <span className="mx-1">&gt;</span>}
              <span className={i === crumbs.length - 1 ? "text-slate-600" : ""}>{c}</span>
            </span>
          ))}
        </p>
      </div>
      {addLabel && (
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2.5 text-sm shrink-0">
          <Plus className="w-4 h-4" />
          {addLabel}
        </button>
      )}
    </div>
  );
}