"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import type { TaxonomyItem } from "@/lib/api/types";

/**
 * One input on a taxonomy form.
 *
 * The six taxonomy screens share a layout but not their fields — a country
 * has an ISO code, a city belongs to a country, a skill has a demand level —
 * so each screen declares its own here rather than the modal guessing.
 */
export interface TaxonomyField {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "color" | "checkbox" | "textarea";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Fixed choices for a select. */
  options?: { value: string | number; label: string }[];
  /** Choices fetched on open, for a select backed by another resource. */
  loadOptions?: () => Promise<{ value: string | number; label: string }[]>;
  /**
   * Whether clearing this field sends null, meaning "erase the value".
   *
   * Set it only where the API's rule is `nullable`. Columns like sort_order
   * and demand_level are NOT NULL with a default, and their rules are
   * `sometimes` — for those, a blank input has to be left out of the payload
   * entirely so the default stands, rather than sent as a null the API
   * rejects.
   */
  nullable?: boolean;
}

interface Props {
  title: string;
  fields: TaxonomyField[];
  /** The record being edited, or null to create one. */
  item: TaxonomyItem | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<unknown>;
  onClose: () => void;
  onSaved: () => void;
}

export default function TaxonomyFormModal({
  title,
  fields,
  item,
  onSubmit,
  onClose,
  onSaved,
}: Props) {
  const editing = item !== null;

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};

    for (const field of fields) {
      const existing = (item as Record<string, unknown> | null)?.[field.name];

      initial[field.name] =
        existing ??
        // A new record starts active; anything else starts blank rather than
        // carrying a value the user did not choose.
        (field.type === "checkbox" ? field.name === "is_active" : "");
    }

    return initial;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  /** Choices for selects that read from another resource, once loaded. */
  const [loaded, setLoaded] = useState<
    Record<string, { value: string | number; label: string }[]>
  >({});

  useEffect(() => {
    let cancelled = false;

    for (const field of fields) {
      if (!field.loadOptions) continue;

      field
        .loadOptions()
        .then((options) => {
          if (!cancelled) setLoaded((prev) => ({ ...prev, [field.name]: options }));
        })
        .catch(() => {
          // A select with no choices is still usable when the field is
          // optional, and the API rejects a bad value either way.
        });
    }

    return () => {
      cancelled = true;
    };
  }, [fields]);

  function set(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {};

      for (const field of fields) {
        const value = values[field.name];

        if (value === "" && !field.required) {
          // Clearable fields send null to erase the value; the rest are left
          // out so the column's default or existing value stands.
          if (field.nullable) payload[field.name] = null;

          continue;
        }

        payload[field.name] =
          field.type === "number" && value !== "" ? Number(value) : value;
      }

      await onSubmit(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err : new ApiError(0, "Could not reach the server."),
      );
      setSaving(false);
    }
  }

  // Any error the API raises against a field the form does not show has to
  // reach the banner, or saving fails with nothing on screen to explain it.
  const shown = new Set(fields.map((f) => f.name));
  const hasInline = [...shown].some((name) => error?.fieldError(name));
  const generalError = error && !hasInline ? error.detail : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
          {generalError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {generalError}
            </div>
          )}

          {fields.map((field) => {
            const fieldError = error?.fieldError(field.name);
            const value = values[field.name];
            const options = field.options ?? loaded[field.name] ?? [];

            if (field.type === "checkbox") {
              return (
                <div key={field.name}>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(e) => set(field.name, e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    {field.label}
                  </label>
                  {/* Indented past the box, so it reads as belonging to it. */}
                  {field.hint && (
                    <p className="mt-1 pl-6 text-xs text-slate-400">
                      {field.hint}
                    </p>
                  )}
                </div>
              );
            }

            return (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="text-sm font-medium text-slate-700"
                >
                  {field.label}{" "}
                  {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === "select" ? (
                  <select
                    id={field.name}
                    value={String(value ?? "")}
                    onChange={(e) => set(field.name, e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">
                      {field.placeholder ?? "Select…"}
                    </option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    rows={2}
                    value={String(value ?? "")}
                    onChange={(e) => set(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : field.type === "color" ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      id={field.name}
                      type="color"
                      value={String(value || "#2563eb")}
                      onChange={(e) => set(field.name, e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-slate-200"
                    />
                    <input
                      value={String(value ?? "")}
                      onChange={(e) => set(field.name, e.target.value)}
                      placeholder="#2563eb"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                ) : (
                  <input
                    id={field.name}
                    type={field.type === "number" ? "number" : "text"}
                    value={String(value ?? "")}
                    onChange={(e) => set(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                )}

                {fieldError ? (
                  <p className="mt-1 text-xs text-red-600">{fieldError}</p>
                ) : (
                  field.hint && (
                    <p className="mt-1 text-xs text-slate-400">{field.hint}</p>
                  )
                )}
              </div>
            );
          })}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
