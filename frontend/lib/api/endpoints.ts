/**
 * Typed wrappers around the API.
 *
 * Components call these rather than assembling URLs, so a route change is a
 * single edit here instead of a search across the codebase.
 */

import { api } from "./client";
import type {
  ApiEnvelope,
  AuditLogEntry,
  Paginated,
  PermissionMatrix,
  Role,
  SettingItem,
  TaxonomyItem,
  TaxonomyStats,
  User,
} from "./types";

// ---------------------------------------------------------------- auth

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: "job_seeker" | "employer" | "author";
  terms_accepted: boolean;
  phone?: string;
}

export const auth = {
  register: (payload: RegisterPayload) =>
    api.post<ApiEnvelope<User>>("/auth/register", payload),

  login: (email: string, password: string, remember = false) =>
    api.post<ApiEnvelope<User>>("/auth/login", { email, password, remember }),

  logout: () => api.post<{ message: string }>("/auth/logout"),

  me: () => api.get<ApiEnvelope<User>>("/auth/me"),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/auth/password/forgot", { email }),

  resetPassword: (payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => api.post<{ message: string }>("/auth/password/reset", payload),

  changePassword: (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => api.put<{ message: string }>("/auth/password", payload),

  resendVerification: () =>
    api.post<{ message: string }>("/auth/email/resend"),

  /**
   * Social sign-in is a full-page redirect rather than a fetch: the provider
   * has to render its own consent screen, which cannot happen inside XHR.
   */
  socialRedirectUrl: (provider: "google" | "linkedin", role?: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const url = new URL(`/api/v1/auth/social/${provider}/redirect`, base);
    if (role) url.searchParams.set("role", role);
    return url.toString();
  },
};

// --------------------------------------------------------------- admin

export const adminUsers = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<Paginated<User>>("/admin/users", params),

  get: (id: number) => api.get<ApiEnvelope<User>>(`/admin/users/${id}`),

  create: (payload: Record<string, unknown>) =>
    api.post<ApiEnvelope<User>>("/admin/users", payload),

  update: (id: number, payload: Record<string, unknown>) =>
    api.put<ApiEnvelope<User>>(`/admin/users/${id}`, payload),

  setStatus: (id: number, status: "active" | "suspended", reason?: string) =>
    api.patch<ApiEnvelope<User>>(`/admin/users/${id}/status`, { status, reason }),

  remove: (id: number) => api.delete<{ message: string }>(`/admin/users/${id}`),

  sendPasswordReset: (id: number) =>
    api.post<{ message: string }>(`/admin/users/${id}/password-reset`),

  stats: () => api.get<ApiEnvelope<Record<string, unknown>>>("/admin/users/stats"),
};

export const adminRoles = {
  list: () => api.get<ApiEnvelope<Role[]>>("/admin/roles"),

  get: (id: number) => api.get<ApiEnvelope<Role>>(`/admin/roles/${id}`),

  matrix: () => api.get<ApiEnvelope<PermissionMatrix>>("/admin/roles/matrix"),

  create: (payload: { label: string; description?: string; permissions?: string[] }) =>
    api.post<ApiEnvelope<Role>>("/admin/roles", payload),

  update: (id: number, payload: { label?: string; description?: string }) =>
    api.put<ApiEnvelope<Role>>(`/admin/roles/${id}`, payload),

  remove: (id: number) => api.delete<{ message: string }>(`/admin/roles/${id}`),

  /** Saves the whole grid at once — the screen has a single Save button. */
  syncPermissions: (id: number, permissions: string[]) =>
    api.put<ApiEnvelope<Role>>(`/admin/roles/${id}/permissions`, { permissions }),

  users: (id: number, params?: Record<string, string | number | undefined>) =>
    api.get<Paginated<User>>(`/admin/roles/${id}/users`, params),
};

/** The six taxonomy screens share one shape, so one factory serves them all. */
function taxonomyResource(resource: string) {
  return {
    list: (params?: Record<string, string | number | undefined>) =>
      api.get<Paginated<TaxonomyItem>>(`/admin/${resource}`, params),

    get: (id: number) =>
      api.get<ApiEnvelope<TaxonomyItem>>(`/admin/${resource}/${id}`),

    create: (payload: Record<string, unknown>) =>
      api.post<ApiEnvelope<TaxonomyItem>>(`/admin/${resource}`, payload),

    update: (id: number, payload: Record<string, unknown>) =>
      api.put<ApiEnvelope<TaxonomyItem>>(`/admin/${resource}/${id}`, payload),

    remove: (id: number) =>
      api.delete<{ message: string }>(`/admin/${resource}/${id}`),

    toggleActive: (id: number) =>
      api.patch<ApiEnvelope<TaxonomyItem>>(`/admin/${resource}/${id}/active`),

    reorder: (order: { id: number; sort_order: number }[]) =>
      api.post<{ message: string }>(`/admin/${resource}/reorder`, { order }),

    stats: () => api.get<ApiEnvelope<TaxonomyStats>>(`/admin/${resource}/stats`),

    exportUrl: () =>
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/${resource}/export`,
  };
}

export const adminTaxonomy = {
  industries: taxonomyResource("industries"),
  jobCategories: taxonomyResource("job-categories"),
  articleCategories: taxonomyResource("article-categories"),
  countries: taxonomyResource("countries"),
  cities: taxonomyResource("cities"),
  skills: taxonomyResource("skills"),
  tags: taxonomyResource("tags"),
};

export const adminSettings = {
  list: (group?: string) =>
    api.get<ApiEnvelope<Record<string, SettingItem[]>>>("/admin/settings", { group }),

  save: (settings: { key: string; value: unknown }[]) =>
    api.put<{ message: string }>("/admin/settings", { settings }),

  uploadFile: (key: string, file: File) => {
    const form = new FormData();
    form.append("key", key);
    form.append("file", file);
    return api.upload<ApiEnvelope<{ key: string; value: string; url: string }>>(
      "/admin/settings/file",
      form,
    );
  },
};

export const adminAudit = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<Paginated<AuditLogEntry>>("/admin/audit-logs", params),

  filters: () =>
    api.get<ApiEnvelope<Record<string, string[]>>>("/admin/audit-logs/filters"),

  stats: () =>
    api.get<ApiEnvelope<Record<string, unknown>>>("/admin/audit-logs/stats"),
};

// -------------------------------------------------------------- public

export const publicApi = {
  settings: () => api.get<ApiEnvelope<Record<string, unknown>>>("/settings"),

  /** Everything a filter sidebar needs, in one round trip. */
  taxonomies: () =>
    api.get<ApiEnvelope<Record<string, TaxonomyItem[]>>>("/taxonomies"),

  countries: () => api.get<ApiEnvelope<TaxonomyItem[]>>("/taxonomies/countries"),

  cities: (countryId?: number) =>
    api.get<ApiEnvelope<TaxonomyItem[]>>("/taxonomies/cities", {
      country_id: countryId,
    }),

  industries: () => api.get<ApiEnvelope<TaxonomyItem[]>>("/taxonomies/industries"),

  jobCategories: () =>
    api.get<ApiEnvelope<TaxonomyItem[]>>("/taxonomies/job-categories"),

  skills: (search?: string) =>
    api.get<ApiEnvelope<TaxonomyItem[]>>("/taxonomies/skills", { search }),

  tags: () => api.get<ApiEnvelope<TaxonomyItem[]>>("/taxonomies/tags"),
};
