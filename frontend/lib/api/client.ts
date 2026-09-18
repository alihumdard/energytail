/**
 * HTTP client for the Laravel API.
 *
 * Authentication is cookie-based (Sanctum SPA mode), so every request sends
 * credentials and no token is ever stored in JavaScript — which keeps it out
 * of reach of an XSS payload.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Error carrying the API's structured response so callers can act on it. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Machine-readable slug: validation_failed, forbidden, unauthenticated… */
    public readonly code?: string,
    /** Field-level messages, keyed by input name. */
    public readonly errors?: Record<string, string[]>,
    /** Seconds until the caller may retry — set on 429s. */
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** First message for a field, ready to render under an input. */
  fieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }

  /**
   * The most specific message this error carries.
   *
   * A 422's top-level message is always "The given data was invalid." — the
   * reason lives in `errors`. Showing the top-level text told a user their
   * delete had failed without saying that the record was still attached to
   * seven jobs, which is the only part they could act on.
   */
  get detail(): string {
    const first = Object.values(this.errors ?? {})[0]?.[0];

    return first ?? this.message;
  }

  get isValidation(): boolean {
    return this.status === 422;
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

/**
 * How long any single request may take before it is abandoned.
 *
 * Generous rather than snappy: the local dev server serialises requests, so a
 * page opening three at once has the last of them waiting on the first two.
 * The point is to end a hang, not to police latency.
 */
const DEFAULT_TIMEOUT_MS = 20_000;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Query string parameters; undefined and null entries are dropped. */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Overrides DEFAULT_TIMEOUT_MS for a call known to be slow, e.g. an export. */
  timeout?: number;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(
    path.startsWith("/") ? `/api/v1${path}` : `/api/v1/${path}`,
    API_URL,
  );

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;

  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

/**
 * Fetches Sanctum's CSRF cookie.
 *
 * Laravel rejects a state-changing request whose X-XSRF-TOKEN header does not
 * match this cookie, so it has to exist before the first POST of a session.
 */
export async function ensureCsrfCookie(): Promise<void> {
  if (readCookie("XSRF-TOKEN")) return;

  // Bounded like every other call: this is awaited before each write, so a
  // hang here would stall the form rather than the request it precedes.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    await fetch(`${API_URL}/sanctum/csrf-cookie`, {
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  // timeout is pulled out here so it is not spread into fetch as an option.
  const {
    body,
    params,
    headers,
    method = "GET",
    timeout = DEFAULT_TIMEOUT_MS,
    ...rest
  } = options;

  const isWrite = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
  const isFormData = body instanceof FormData;

  if (isWrite && typeof window !== "undefined") {
    await ensureCsrfCookie();
  }

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(headers as Record<string, string>),
  };

  // Laravel URL-decodes this header before comparing it to the cookie.
  const xsrf = readCookie("XSRF-TOKEN");
  if (xsrf && isWrite) {
    requestHeaders["X-XSRF-TOKEN"] = decodeURIComponent(xsrf);
  }

  /*
   * Every request is given a deadline.
   *
   * Without one, a request that never settles leaves the caller's loading
   * flag true forever: the screen shows a spinner with no error and no way to
   * retry. That is not hypothetical here — `php artisan serve` handles one
   * request at a time and cannot fork on Windows, so a single slow call
   * (a mail send, a large export) stalls every other request behind it.
   *
   * An abort surfaces as a normal ApiError, so the screens that already
   * render an error with a "Try again" button need no changes.
   */
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response: Response;

  try {
    response = await fetch(buildUrl(path, params), {
      ...rest,
      method,
      headers: requestHeaders,
      // Sends and accepts the session cookie. Without this the API sees every
      // request as an anonymous one.
      credentials: "include",
      signal: controller.signal,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        0,
        "The server took too long to respond. Please try again.",
        "timeout",
      );
    }

    throw new ApiError(0, "Could not reach the server. Check your connection.");
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    /*
     * Laravel's throttle sets Retry-After; the per-user cooldowns put the
     * same figure in the body. Either way the form needs it to count down
     * rather than telling the user to "try again later" indefinitely.
     */
    const headerRetry = Number(response.headers.get("retry-after"));
    const retryAfter =
      payload?.retry_after ?? (Number.isFinite(headerRetry) && headerRetry > 0
        ? headerRetry
        : undefined);

    throw new ApiError(
      response.status,
      payload?.message ?? `Request failed with status ${response.status}`,
      payload?.code,
      payload?.errors,
      retryAfter,
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, params?: RequestOptions["params"]) =>
    apiFetch<T>(path, { method: "GET", params }),

  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body }),

  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PUT", body }),

  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body }),

  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),

  upload: <T>(path: string, formData: FormData) =>
    apiFetch<T>(path, { method: "POST", body: formData }),
};

export { API_URL };
