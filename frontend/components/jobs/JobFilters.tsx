"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
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
            options={countries}
            onChange={(v) => apply("country", v)}
          />
          <Select
            label="Category"
            value={active.category ?? ""}
            options={categories}
            onChange={(v) => apply("category", v)}
          />
          <Select
            label="Industry"
            value={active.industry ?? ""}
            options={industries}
            onChange={(v) => apply("industry", v)}
          />

          <div>
            <label
              htmlFor="employment_type"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Employment Type
            </label>
            <select
              id="employment_type"
              value={active.employment_type ?? ""}
              onChange={(e) => apply("employment_type", e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Any type</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

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

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: NamedRef[];
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase();

  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">All {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
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
