"use client";

import { useState, type ReactNode } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";

/**
 * The frame every repeating profile section uses: a titled card, a list of
 * rows, and one inline form that doubles as "add" and "edit".
 *
 * Five sections share this rather than each owning a copy — they differ only
 * in their fields, and five hand-written copies would drift in exactly the
 * places nobody clicks.
 */

export interface SectionRow {
  id: number;
}

interface Props<T extends SectionRow> {
  title: string;
  /** Shown when the list is empty — says what belongs here, not just "no data". */
  emptyHint: string;
  addLabel: string;
  rows: T[] | null;
  /** Renders one row's summary. Editing and deleting are handled here. */
  renderRow: (row: T) => ReactNode;
  /**
   * The fields, given the row being edited (null when adding).
   * Returns the form body; the card supplies the save/cancel buttons.
   */
  renderForm: (editing: T | null) => ReactNode;
  onSubmit: (editing: T | null, form: FormData) => Promise<void>;
  onDelete: (row: T) => Promise<void>;
}

export default function SectionCard<T extends SectionRow>({
  title,
  emptyHint,
  addLabel,
  rows,
  renderRow,
  renderForm,
  onSubmit,
  onDelete,
}: Props<T>) {
  /*
   * null  — form closed
   * "new" — adding
   * T     — editing that row
   */
  const [open, setOpen] = useState<"new" | T | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  const editing = open === "new" || open === null ? null : open;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await onSubmit(editing, new FormData(event.currentTarget));
      setOpen(null);
    } catch (err) {
      setError(err instanceof ApiError ? err : null);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: T) {
    setRemoving(row.id);

    try {
      await onDelete(row);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">{title}</h2>

        {open === null && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setOpen("new");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Plus size={15} /> {addLabel}
          </button>
        )}
      </div>

      {rows === null ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : (
        <>
          {rows.length === 0 && open === null && (
            <p className="mt-3 text-sm text-slate-500">{emptyHint}</p>
          )}

          {rows.length > 0 && (
            <ul className="mt-4 divide-y divide-slate-100">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div className="min-w-0 flex-1">{renderRow(row)}</div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setOpen(row);
                      }}
                      aria-label={`Edit ${title}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(row)}
                      disabled={removing === row.id}
                      aria-label={`Remove from ${title}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {removing === row.id ? (
                        <Loader2 className="h-[15px] w-[15px] animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {open !== null && (
        /*
         * Keyed by which row is being edited, so switching from one row to
         * another remounts the inputs and they re-seed from defaultValue
         * rather than keeping the previous row's text.
         */
        <form
          key={editing?.id ?? "new"}
          onSubmit={submit}
          noValidate
          className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error.detail}
            </p>
          )}

          {renderForm(editing)}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(null);
                setError(null);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <X size={15} /> Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
