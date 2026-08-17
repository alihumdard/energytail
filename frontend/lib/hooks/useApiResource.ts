"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Loads data from the API and re-runs when its dependencies change.
 *
 * Deliberately small: the admin screens need loading, error and refetch, and
 * nothing here justifies pulling in a data-fetching library yet.
 */
export function useApiResource<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): State<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    error: null,
  });

  // Tracks the most recent request so a slow earlier response cannot
  // overwrite a newer one — the classic race when filters change quickly.
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetcher();
      if (id === requestId.current) {
        setState({ data, loading: false, error: null });
      }
    } catch (err) {
      if (id !== requestId.current) return;

      setState({
        data: null,
        loading: false,
        error:
          err instanceof ApiError
            ? err
            : new ApiError(0, "Could not reach the server."),
      });
    }
    // fetcher is recreated on every render by callers, so depending on it
    // here would loop. The caller's deps array is the real signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}

/** Delays a fast-changing value, so typing does not fire a request per key. */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
