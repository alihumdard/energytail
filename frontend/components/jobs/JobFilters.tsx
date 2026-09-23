"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import type { NamedRef } from "@/lib/api/types";

/**
 * Filter controls for the job board sidebar.
 *
 * Keyword search now lives in the hero (JobSearchBar) so this panel is
 * filters only. Every choice is still written into the URL rather than kept
 * in component state, so a filtered board can be linked, bookmarked and
 * indexed — the page is server-rendered from those same parameters.
 */

interface Props {
  countries: NamedRef[];
  categories: NamedRef[];
  industries: NamedRef[];
  /** Current values, read from the URL by the page. */
  active: Record<string, string>;
}

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
];

export default function JobFilters({ countries, categories, industries, active }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  /** Writes one filter into the URL, dropping it when cleared. */
  function apply(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Any filter change invalidates the current page number.
    params.delete("page");

    router.push(`/jobs?${params.toString()}`);
  }

  const activeCount = Object.entries(active).filter(
    ([key, value]) => value && key !== "search" && key !== "page",
  ).length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          )}
        </span>
        <span className="text-xs text-slate-400">{open ? "Hide" : "Show"}</span>
      </button>

      <div className={`${open ? "mt-4 block" : "hidden"} lg:mt-0 lg:block`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Filters</h2>
          {activeCount > 0 && (
            <button
              onClick={() => router.push("/jobs")}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </div>

        <div className="mt-4 space-y-4">
          <Select
            label="Country"
            value={active.country ?? ""}
            options={asOptions(countries)}
            placeholder="All countries"
            onChange={(v) => apply("country", v)}
          />
          <Select
            label="Category"
            value={active.category ?? ""}
            options={asOptions(categories)}
            placeholder="All categories"
            onChange={(v) => apply("category", v)}
          />
          <Select
            label="Industry"
            value={active.industry ?? ""}
            options={asOptions(industries)}
            placeholder="All industries"
            onChange={(v) => apply("industry", v)}
          />
          <Select
            label="Employment Type"
            value={active.employment_type ?? ""}
            options={EMPLOYMENT_TYPES}
            placeholder="Any type"
            onChange={(v) => apply("employment_type", v)}
          />

          <div className="space-y-1 border-t border-slate-100 pt-4">
            <Toggle
              label="Remote only"
              checked={active.remote === "1"}
              onChange={(on) => apply("remote", on ? "1" : "")}
            />
            <Toggle
              label="Featured"
              checked={active.featured === "1"}
              onChange={(on) => apply("featured", on ? "1" : "")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * One filter dropdown.
 *
 * Searchable rather than native: the country list alone runs to the whole
 * world, and finding one in a scroll of two hundred is the slowest part of
 * using the board. Short lists get the same control for consistency — it
 * hides its own search box below a handful of options.
 */
function Select({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        {label}
      </label>
      <div className="mt-1.5">
        <SearchableSelect
          id={id}
          options={options}
          value={value || null}
          onChange={(next) => onChange(next === null ? "" : String(next))}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

/** NamedRef is {name, slug}; the select speaks {label, value}. */
function asOptions(refs: NamedRef[]): { value: string; label: string }[] {
  return refs.map((ref) => ({ value: ref.slug, label: ref.name }));
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-[18px] w-[18px] shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/30"
      />
      {label}
    </label>
  );
}
