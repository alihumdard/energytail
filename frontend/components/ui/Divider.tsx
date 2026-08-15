export default function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-slate-400">
      <div className="flex-1 h-px bg-slate-200" />
      {label}
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}
