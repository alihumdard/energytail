"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: string;
  /** Shown to the right of the label — a country code, a parent name. */
  hint?: string;
  /** Rendered before the label, e.g. a flag. */
  prefix?: string;
}

interface Props {
  id?: string;
  options: SelectOption[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  /** Shown in the list while options are still being fetched. */
  loading?: boolean;
  /** Whether the chosen value can be cleared from inside the control. */
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** Below this many options the search box is more friction than help. */
  searchThreshold?: number;
}

/**
 * A select you can type into.
 *
 * A native <select> is fine for five choices and unusable for two hundred:
 * the country list runs to 198, and finding "United Arab Emirates" in it
 * means either scrolling or knowing to type the first letters blind. This
 * filters as you type, and keeps the keyboard behaviour a select has —
 * arrows move, Enter picks, Escape closes — because a div that only answers
 * to the mouse is a step backwards from the thing it replaces.
 *
 * The list is rendered inside the form rather than in a portal, so it scrolls
 * and stacks with the modal around it. It flips above the control when there
 * is no room below, which on a phone is most of the time.
 */
export default function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "Select…",
  loading = false,
  clearable = true,
  disabled = false,
  invalid = false,
  searchThreshold = 8,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [dropUp, setDropUp] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const listId = useId();
  const searchable = options.length >= searchThreshold;

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value ?? "")) ?? null,
    [options, value],
  );

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;

    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(needle) ||
        o.hint?.toLowerCase().includes(needle),
    );
  }, [options, query]);

  // Close on an outside click or a scroll that would leave the list floating
  // away from its control.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  // Open upwards when the space below is too small to show the list — inside
  // a modal near the bottom of the viewport, that is the normal case.
  useEffect(() => {
    if (!open || !rootRef.current) return;

    const box = rootRef.current.getBoundingClientRect();
    setDropUp(window.innerHeight - box.bottom < 280 && box.top > 280);

    // Focusing the search box is what makes typing work without a second
    // click; without a search box the list itself takes focus.
    searchRef.current?.focus();
  }, [open]);

  // Keep the highlighted row in view as the arrows walk past the fold.
  useEffect(() => {
    if (!open) return;

    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function openList() {
    if (disabled) return;

    setQuery("");
    setActive(Math.max(0, matches.findIndex((o) => o === selected)));
    setOpen(true);
  }

  function choose(option: SelectOption) {
    onChange(option.value);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (["Enter", " ", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((i) => Math.min(i + 1, matches.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(matches.length - 1);
        break;
      case "Enter":
        event.preventDefault();
        if (matches[active]) choose(matches[active]);
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className={`flex w-full items-center gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
          invalid
            ? "border-red-300 focus:border-red-400"
            : open
              ? "border-blue-400"
              : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span
          className={`flex min-w-0 flex-1 items-center gap-1.5 truncate ${
            selected ? "text-slate-900" : "text-slate-400"
          }`}
        >
          {selected?.prefix && <span>{selected.prefix}</span>}
          {selected?.label ?? placeholder}
        </span>

        {/* Clearing is its own hit target, so reaching for it cannot be
            mistaken for opening the list. */}
        {clearable && selected && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear selection"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}

        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
        ) : (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {open && (
        <div
          className={`absolute z-20 w-full rounded-lg border border-slate-200 bg-white shadow-lg ${
            dropUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {searchable && (
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search…"
                aria-label="Search options"
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          )}

          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            // Capped so the list never runs off the screen; on a short phone
            // viewport the cap is the smaller of the two.
            className="max-h-[min(15rem,40vh)] overflow-y-auto overscroll-contain py-1"
          >
            {loading && matches.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-400">Loading…</li>
            )}

            {!loading && matches.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-400">
                No matches for “{query}”
              </li>
            )}

            {matches.map((option, index) => {
              const isSelected = String(option.value) === String(value ?? "");

              return (
                <li
                  key={option.value}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => choose(option)}
                  onMouseEnter={() => setActive(index)}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                    index === active ? "bg-blue-50" : ""
                  } ${isSelected ? "font-medium text-blue-700" : "text-slate-700"}`}
                >
                  {option.prefix && <span className="shrink-0">{option.prefix}</span>}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.hint && (
                    <span className="shrink-0 text-xs text-slate-400">
                      {option.hint}
                    </span>
                  )}
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
