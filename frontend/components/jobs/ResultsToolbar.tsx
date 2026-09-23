"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import type { NamedRef } from "@/lib/api/types";

/**
 * Sort control and active-filter chips above the results.
 *
 * A client component for the same reason JobFilters is: both write straight
 * into the URL so the board stays linkable, and only the sort/removal
 * interactions need JS — the list itself is still server-rendered.
 */

const SORT_OPTIONS = [
  { value: "", label: "Newest" },
  { value: "salary", label: "Salary: High to Low" },
];

/** One removable chip per active filter, labelled for a human rather than
 *  showing the raw slug. */
interface ChipDef {
  key: string;
  label: string;
}

export default function ResultsToolbar({
  active,
  sort,
  countries,
  categories,
  industries,
  summary,
}: {
  active: Record<string, string>;
  sort: string;
  countries: NamedRef[];
  categories: NamedRef[];
  industries: NamedRef[];
  /** "Showing 1–15 of 27", rendered on the same row as the sort control. */
  summary: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function nameFor(list: NamedRef[], slug: string): string {
    return list.find((item) => item.slug === slug)?.name ?? slug;
  }

  const EMPLOYMENT_LABELS: Record<string, string> = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract",
    temporary: "Temporary",
    internship: "Internship",
  };

  const chips: ChipDef[] = [
    active.search && { key: "search", label: `"${active.search}"` },
    active.country && { key: "country", label: nameFor(countries, active.country) },
    active.category && { key: "category", label: nameFor(categories, active.category) },
    active.industry && { key: "industry", label: nameFor(industries, active.industry) },
    active.employment_type && {
      key: "employment_type",
      label: EMPLOYMENT_LABELS[active.employment_type] ?? active.employment_type,
    },
    active.remote === "1" && { key: "remote", label: "Remote only" },
    active.featured === "1" && { key: "featured", label: "Featured" },
  ].filter(Boolean) as ChipDef[];

  function removeChip(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    router.push(`/jobs?${params.toString()}`);
  }

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    params.delete("page");
    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <div className="mb-4 space-y-3">
      {/* Chips first, on their own line — they wrap freely without ever
          pushing the sort control off the row below. */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => removeChip(chip.key)}
              className="flex items-center gap-1.5 rounded-full bg-blue-50 py-1.5 pl-3 pr-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              {chip.label}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* The result count belongs beside the control that reorders it,
            rather than stranded on a line of its own above the toolbar. */}
        <p className="text-sm text-slate-500">{summary}</p>

        <div className="ml-auto flex shrink-0 items-center gap-2 text-sm text-slate-500">
          <span id="sort-label">Sort by</span>
          <div className="w-44">
            <SearchableSelect
              options={SORT_OPTIONS.filter((o) => o.value !== "")}
              value={sort || null}
              onChange={(next) => setSort(next === null ? "" : String(next))}
              // Clearing returns to the default order, which is what the
              // empty sort value means to the page.
              placeholder="Newest"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
