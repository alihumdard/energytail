"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";

/**
 * The primary keyword search, lifted into the hero.
 *
 * Split out of JobFilters so the hero has real content instead of a bare
 * title, matching the homepage's search-in-hero pattern. Still just another
 * URL-writing control — the same contract JobFilters and ResultsToolbar use.
 */
export default function JobSearchBar({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(defaultValue ?? "");

  function submit(event: FormEvent) {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());
    const value = term.trim();

    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page");

    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      // p-1.5 with a rounded button inside, rather than a button flush to
      // the form's edge: the old version butted a square green block
      // against the white field and read as two controls stuck together.
      className="mt-6 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-black/5 transition-shadow focus-within:ring-2 focus-within:ring-blue-500/40"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Job title, company or keyword"
          aria-label="Search jobs"
          className="w-full bg-transparent py-3 pl-11 pr-2 text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
        />

        {/* Clearing a term should not mean selecting it and pressing
            delete, which is the only way the old field offered. */}
        {term && (
          <button
            type="button"
            onClick={() => setTerm("")}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <button
        type="submit"
        className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:px-7"
      >
        <Search size={16} />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}
