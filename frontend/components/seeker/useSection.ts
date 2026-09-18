"use client";

import { useCallback, useEffect, useState } from "react";
import type { SectionRow } from "./SectionCard";

interface SectionApi<T> {
  list: () => Promise<{ data: T[] }>;
  create: (payload: Record<string, unknown>) => Promise<{ data: T }>;
  update: (
    id: number,
    payload: Record<string, unknown>,
  ) => Promise<{ data: T }>;
  remove: (id: number) => Promise<unknown>;
}

/**
 * Loads a profile section and keeps it in step with the server.
 *
 * After every write the list is refetched rather than patched locally: the
 * server decides the order (most recent first for dated sections), so a
 * locally-inserted row would sit in the wrong place until the next reload.
 */
export function useSection<T extends SectionRow>(
  api: SectionApi<T>,
  enabled: boolean,
) {
  const [rows, setRows] = useState<T[] | null>(null);

  const reload = useCallback(async () => {
    const { data } = await api.list();
    setRows(data);
  }, [api]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    api
      .list()
      .then(({ data }) => {
        if (!cancelled) setRows(data);
      })
      // An empty list is the honest fallback: showing a spinner for ever
      // would suggest the section is still loading when it has failed.
      .catch(() => {
        if (!cancelled) setRows([]);
      });

    return () => {
      cancelled = true;
    };
  }, [api, enabled]);

  const save = useCallback(
    async (editing: T | null, payload: Record<string, unknown>) => {
      if (editing) {
        await api.update(editing.id, payload);
      } else {
        await api.create(payload);
      }

      await reload();
    },
    [api, reload],
  );

  const remove = useCallback(
    async (row: T) => {
      await api.remove(row.id);
      await reload();
    },
    [api, reload],
  );

  return { rows, save, remove, reload };
}

/**
 * Reads a form field, turning the empty string into null.
 *
 * An untouched optional input submits "", which the API would store as an
 * empty string rather than "not provided" — and a date field would reject it.
 */
export function text(form: FormData, name: string): string | null {
  const value = form.get(name);

  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/** Reads a checkbox: present in FormData only when ticked. */
export function checked(form: FormData, name: string): boolean {
  return form.get(name) !== null;
}

/** Reads a numeric field, keeping null distinct from zero. */
export function number(form: FormData, name: string): number | null {
  const value = text(form, name);
  if (value === null) return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}
