import type { ReactNode } from "react";

/**
 * Form controls shared by the profile sections.
 *
 * Uncontrolled on purpose: the sections read their values from FormData on
 * submit, so a row's fields seed from defaultValue and React holds no state
 * per keystroke.
 */

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  placeholder,
  span,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
  /** Set to make the field fill the row on a two-column grid. */
  span?: boolean;
}) {
  return (
    <label className={`block ${span ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block sm:col-span-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    </label>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
  placeholder = "Not specified",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Check({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 sm:col-span-2">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-300"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

/** Two-column grid the section forms lay their fields out on. */
export function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

/**
 * Turns a date range into the "Mar 2019 — Present" line the rows show.
 *
 * Dates arrive as ISO strings; formatting them here keeps every section
 * reading the same way.
 */
export function period(
  from: string | null,
  to: string | null,
  current: boolean,
): string {
  const month = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        })
      : "";

  const start = month(from);
  const end = current ? "Present" : month(to);

  if (!start && !end) return "";

  return [start, end].filter(Boolean).join(" — ");
}
