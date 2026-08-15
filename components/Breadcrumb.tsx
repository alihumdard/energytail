import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Breadcrumb({ current }: { current: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-slate-500 flex flex-wrap items-center gap-1.5">
      <Link href="/" className="hover:text-blue-600">
        Home
      </Link>
      <ChevronRight className="w-3.5 h-3.5" />
      <span className="text-slate-800 font-medium">{current}</span>
    </div>
  );
}
