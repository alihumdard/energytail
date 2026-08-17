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
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** First message for a field, ready to render under an input. */
  fieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
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
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Query string parameters; undefined and null entries are dropped. */
  params?: Record<string, string | number | boolean | undefined | null>;
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

  await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, headers, method = "GET", ...rest } = options;

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

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    method,
    headers: requestHeaders,
    // Sends and accepts the session cookie. Without this the API sees every
    // request as an anonymous one.
    credentials: "include",
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.message ?? `Request failed with status ${response.status}`,
      payload?.code,
      payload?.errors,
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
