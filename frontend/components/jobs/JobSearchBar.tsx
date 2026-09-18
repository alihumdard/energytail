"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

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
      className="mt-6 flex max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Job title, company or keyword"
          aria-label="Search jobs"
          className="w-full py-3.5 pl-11 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      <button
        type="submit"
        className="flex shrink-0 items-center gap-2 bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        <Search size={15} />
        Search
      </button>
    </form>
  );
}
