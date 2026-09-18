import "server-only";

/**
 * Fetches public API data during server rendering.
 *
 * Separate from lib/api/client.ts, which is built for the browser: it reads
 * document.cookie for the CSRF token and sends credentials. None of that
 * exists here, and none of it is wanted — these are the pages a crawler
 * loads with no session at all, which is the whole point of rendering them
 * on the server.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ServerFetchError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ServerFetchError";
  }
}

interface Options {
  /** Query string parameters; empty, null and undefined entries are dropped. */
  params?: Record<string, string | number | boolean | undefined | null>;
  /**
   * Seconds to cache the response. Job listings change through the day, so a
   * short window keeps pages fast without serving a stale board.
   */
  revalidate?: number;
}

export async function fetchPublic<T>(
  path: string,
  { params, revalidate = 60 }: Options = {},
): Promise<T> {
  const url = new URL(
    path.startsWith("/") ? `/api/v1${path}` : `/api/v1/${path}`,
    API_URL,
  );

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate },
  });

  if (!response.ok) {
    // 404 is meaningful to callers — a missing job should render notFound()
    // rather than an error page — so the status travels with the error.
    throw new ServerFetchError(
      response.status,
      `Request to ${path} failed with status ${response.status}`,
    );
  }

  return (await response.json()) as T;
}
