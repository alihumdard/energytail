"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

type Action<T> =
  | { type: "start" }
  | { type: "success"; data: T }
  | { type: "failure"; error: ApiError };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case "start":
      return { ...state, loading: true, error: null };
    case "success":
      return { data: action.data, loading: false, error: null };
    case "failure":
      return { data: null, loading: false, error: action.error };
  }
}

/**
 * Loads data from the API and re-runs when the given keys change.
 *
 * Deliberately small: the admin screens need loading, error and refetch, and
 * nothing here yet justifies a data-fetching library.
 *
 * `fetcher` is read from a ref inside the effect rather than being a
 * dependency. Callers build a new closure on every render, so depending on it
 * would re-request forever; `keys` is the real signal for when to reload.
 */
export function useApiResource<T>(
  fetcher: () => Promise<T>,
  keys: unknown[] = [],
): State<T> & { refetch: () => void } {
  const [state, dispatch] = useReducer(reducer<T>, {
    data: null,
    loading: true,
    error: null,
  });

  const fetcherRef = useRef(fetcher);

  // Assigned in an effect, never during render: React may discard a render,
  // and mutating a ref in the render body is not safe.
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  /** Bumped to force a reload without changing the caller's keys. */
  const [reloadToken, setReloadToken] = useState(0);

  // Guards against a slow earlier response overwriting a newer one — the
  // classic race when filters change quickly.
  const requestId = useRef(0);

  const serialisedKeys = JSON.stringify(keys);

  useEffect(() => {
    const id = ++requestId.current;
    let cancelled = false;

    const run = async () => {
      dispatch({ type: "start" });

      try {
        const data = await fetcherRef.current();
        if (cancelled || id !== requestId.current) return;
        dispatch({ type: "success", data });
      } catch (err: unknown) {
        if (cancelled || id !== requestId.current) return;

        dispatch({
          type: "failure",
          error:
            err instanceof ApiError
              ? err
              : new ApiError(0, "Could not reach the server."),
        });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [serialisedKeys, reloadToken]);

  return {
    ...state,
    refetch: () => setReloadToken((n) => n + 1),
  };
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
