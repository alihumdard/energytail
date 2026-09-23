/**
 * Typed wrappers around the API.
 *
 * Components call these rather than assembling URLs, so a route change is a
 * single edit here instead of a search across the codebase.
 */

import { api } from "./client";
import type {
  AdminComment,
  CommentStats,
  CommentThreadMeta,
  PublicComment,
  SeekerCertificate,
  SeekerEducation,
  SeekerExperience,
  SeekerLanguage,
  SeekerPortfolioItem,
  SeekerProfile,
  SeekerSkill,
  ApiEnvelope,
  AdminJob,
  AdminCompany,
  AdminArticle,
  AdminDashboard,
  AuthorArticle,
  AuthorArticleStats,
  SavedJob,
  JobAlert,
  SeekerDashboard,
  EmployerCompany,
  Resume,
  Plan,
  BillingOverview,
  CompanySubscription,
  AuditLogEntry,
  DonutSlice,
  Paginated,
  PermissionMatrix,
  Role,
  EmployerJob,
  EmployerJobStats,
  MailHealth,
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
  /** Required when role is "employer" — the company jobs get posted under. */
  company_name?: string;
  company_website?: string;
  /** Present only while CAPTCHA is enabled on the server. */
  captcha_token?: string;
}

export const auth = {
  register: (payload: RegisterPayload) =>
    api.post<ApiEnvelope<User>>("/auth/register", payload),

  login: (
    email: string,
    password: string,
    remember = false,
    captchaToken?: string,
  ) =>
    api.post<ApiEnvelope<User>>("/auth/login", {
      email,
      password,
      remember,
      captcha_token: captchaToken,
    }),

  logout: () => api.post<{ message: string }>("/auth/logout"),

  me: () => api.get<ApiEnvelope<User>>("/auth/me"),

  forgotPassword: (email: string, captchaToken?: string) =>
    api.post<{ message: string }>("/auth/password/forgot", {
      email,
      captcha_token: captchaToken,
    }),

  resetPassword: (payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
    captcha_token?: string;
  }) => api.post<{ message: string }>("/auth/password/reset", payload),

  changePassword: (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => api.put<{ message: string }>("/auth/password", payload),

  /** Resolves with the cooldown so the button can count down before re-arming. */
  resendVerification: () =>
    api.post<{ message: string; retry_after?: number }>("/auth/email/resend"),

  /**
   * Checks an address while the user types, so a duplicate surfaces before
   * they fill in the rest of the form.
   */
  emailAvailable: (email: string) =>
    api.post<ApiEnvelope<{ email: string; available: boolean }>>(
      "/auth/email/available",
      { email },
    ),

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
    api.patch<ApiEnvelope<User>>(`/admin/users/${id}/status`, {
      status,
      reason,
    }),

  remove: (id: number) => api.delete<{ message: string }>(`/admin/users/${id}`),

  sendPasswordReset: (id: number) =>
    api.post<{ message: string }>(`/admin/users/${id}/password-reset`),

  stats: () =>
    api.get<ApiEnvelope<Record<string, unknown>>>("/admin/users/stats"),
};

export const adminRoles = {
  list: () => api.get<ApiEnvelope<Role[]>>("/admin/roles"),

  get: (id: number) => api.get<ApiEnvelope<Role>>(`/admin/roles/${id}`),

  matrix: () => api.get<ApiEnvelope<PermissionMatrix>>("/admin/roles/matrix"),

  create: (payload: {
    label: string;
    description?: string;
    permissions?: string[];
  }) => api.post<ApiEnvelope<Role>>("/admin/roles", payload),

  update: (id: number, payload: { label?: string; description?: string }) =>
    api.put<ApiEnvelope<Role>>(`/admin/roles/${id}`, payload),

  remove: (id: number) => api.delete<{ message: string }>(`/admin/roles/${id}`),

  /** Saves the whole grid at once — the screen has a single Save button. */
  syncPermissions: (id: number, permissions: string[]) =>
    api.put<ApiEnvelope<Role>>(`/admin/roles/${id}/permissions`, {
      permissions,
    }),

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

    stats: () =>
      api.get<ApiEnvelope<TaxonomyStats>>(`/admin/${resource}/stats`),

    exportUrl: () =>
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/${resource}/export`,

    /**
     * Every record, for a dropdown that has to offer all of them.
     *
     * The API caps per_page at 100, so a single request cannot return the
     * 198 countries — asking for more silently returns the first hundred,
     * which is why two thirds of the world was missing from the city form.
     * Pages are followed until the last one, with a ceiling so a resource
     * that grows unexpectedly cannot turn one dropdown into fifty requests.
     */
    listAll: async (
      params?: Record<string, string | number | undefined>,
    ): Promise<TaxonomyItem[]> => {
      const all: TaxonomyItem[] = [];
      const maxPages = 20;

      for (let page = 1; page <= maxPages; page++) {
        const { data, meta } = await api.get<Paginated<TaxonomyItem>>(
          `/admin/${resource}`,
          { ...params, per_page: 100, page },
        );

        all.push(...data);

        if (page >= meta.last_page) break;
      }

      return all;
    },
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
    api.get<ApiEnvelope<Record<string, SettingItem[]>>>("/admin/settings", {
      group,
    }),

  /** Whether outgoing mail is configured and delivering. */
  mailHealth: () =>
    api.get<ApiEnvelope<MailHealth>>("/admin/settings/mail-health"),

  sendTestEmail: (email: string) =>
    api.post<{ message: string }>("/admin/settings/mail-test", { email }),

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

  countries: () =>
    api.get<ApiEnvelope<TaxonomyItem[]>>("/taxonomies/countries"),

  cities: (countryId?: number) =>
    api.get<ApiEnvelope<TaxonomyItem[]>>("/taxonomies/cities", {
      country_id: countryId,
    }),

  industries: () =>
    api.get<ApiEnvelope<TaxonomyItem[]>>("/taxonomies/industries"),

  articleCategories: () =>
    api.get<ApiEnvelope<TaxonomyItem[]>>("/taxonomies/article-categories"),

  jobCategories: () =>
    api.get<ApiEnvelope<TaxonomyItem[]>>("/taxonomies/job-categories"),

  skills: (search?: string) =>
    api.get<ApiEnvelope<TaxonomyItem[]>>("/taxonomies/skills", { search }),

  tags: () => api.get<ApiEnvelope<TaxonomyItem[]>>("/taxonomies/tags"),
};

// ------------------------------------------------------------- employer

export const employerJobs = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<Paginated<EmployerJob>>("/employer/jobs", params),

  stats: () => api.get<ApiEnvelope<EmployerJobStats>>("/employer/jobs/stats"),

  get: (id: number) =>
    api.get<ApiEnvelope<EmployerJob>>(`/employer/jobs/${id}`),

  create: (payload: Record<string, unknown> | FormData) =>
    api.post<ApiEnvelope<EmployerJob>>("/employer/jobs", payload),

  /**
   * FormData goes as POST with _method=PUT, not as a real PUT.
   *
   * PHP only parses a multipart body on POST — it populates $_FILES from
   * nothing else — so a PUT carrying a file arrives with the upload
   * missing and every other field empty. Laravel's method spoofing is the
   * standard way around it, and the route still resolves to update().
   */
  update: (id: number, payload: Record<string, unknown> | FormData) => {
    if (payload instanceof FormData) {
      payload.append("_method", "PUT");

      return api.post<ApiEnvelope<EmployerJob>>(`/employer/jobs/${id}`, payload);
    }

    return api.put<ApiEnvelope<EmployerJob>>(`/employer/jobs/${id}`, payload);
  },

  close: (id: number) =>
    api.patch<ApiEnvelope<EmployerJob>>(`/employer/jobs/${id}/close`),

  reopen: (id: number) =>
    api.patch<ApiEnvelope<EmployerJob>>(`/employer/jobs/${id}/reopen`),
};

export const adminJobs = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<Paginated<AdminJob>>("/admin/jobs", params),

  stats: () =>
    api.get<
      ApiEnvelope<{ stats: Record<string, number>; donut: DonutSlice[] }>
    >("/admin/jobs/stats"),

  approve: (id: number) =>
    api.patch<ApiEnvelope<AdminJob>>(`/admin/jobs/${id}/approve`),

  reject: (id: number, reason: string) =>
    api.patch<ApiEnvelope<AdminJob>>(`/admin/jobs/${id}/reject`, { reason }),

  toggleFeatured: (id: number) =>
    api.patch<ApiEnvelope<AdminJob>>(`/admin/jobs/${id}/featured`),

  remove: (id: number) => api.delete<{ message: string }>(`/admin/jobs/${id}`),
};

export const adminCompanies = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<Paginated<AdminCompany>>("/admin/companies", params),

  stats: () =>
    api.get<
      ApiEnvelope<{ stats: Record<string, number>; donut: DonutSlice[] }>
    >("/admin/companies/stats"),

  get: (id: number) =>
    api.get<ApiEnvelope<AdminCompany>>(`/admin/companies/${id}`),

  update: (id: number, payload: Record<string, unknown>) =>
    api.put<ApiEnvelope<AdminCompany>>(`/admin/companies/${id}`, payload),

  approve: (id: number) =>
    api.patch<ApiEnvelope<AdminCompany>>(`/admin/companies/${id}/approve`),

  suspend: (id: number, reason: string) =>
    api.patch<ApiEnvelope<AdminCompany>>(`/admin/companies/${id}/suspend`, {
      reason,
    }),

  toggleVerified: (id: number) =>
    api.patch<ApiEnvelope<AdminCompany>>(`/admin/companies/${id}/verified`),

  toggleFeatured: (id: number) =>
    api.patch<ApiEnvelope<AdminCompany>>(`/admin/companies/${id}/featured`),
};

export const adminArticles = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<Paginated<AdminArticle>>("/admin/articles", params),

  stats: () =>
    api.get<
      ApiEnvelope<{ stats: Record<string, number>; donut: DonutSlice[] }>
    >("/admin/articles/stats"),

  get: (id: number) =>
    api.get<ApiEnvelope<AdminArticle>>(`/admin/articles/${id}`),

  update: (id: number, payload: Record<string, unknown>) =>
    api.put<ApiEnvelope<AdminArticle>>(`/admin/articles/${id}`, payload),

  approve: (id: number) =>
    api.patch<ApiEnvelope<AdminArticle>>(`/admin/articles/${id}/approve`),

  reject: (id: number, reason: string) =>
    api.patch<ApiEnvelope<AdminArticle>>(`/admin/articles/${id}/reject`, {
      reason,
    }),

  unpublish: (id: number) =>
    api.patch<ApiEnvelope<AdminArticle>>(`/admin/articles/${id}/unpublish`),

  toggleFeatured: (id: number) =>
    api.patch<ApiEnvelope<AdminArticle>>(`/admin/articles/${id}/featured`),

  remove: (id: number) =>
    api.delete<{ message: string }>(`/admin/articles/${id}`),
};

export const adminDashboard = {
  get: () => api.get<ApiEnvelope<AdminDashboard>>("/admin/dashboard"),
};

export const authorArticles = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<Paginated<AuthorArticle>>("/author/articles", params),

  stats: () =>
    api.get<ApiEnvelope<AuthorArticleStats>>("/author/articles/stats"),

  get: (id: number) =>
    api.get<ApiEnvelope<AuthorArticle>>(`/author/articles/${id}`),

  create: (payload: Record<string, unknown> | FormData) =>
    api.post<ApiEnvelope<AuthorArticle>>("/author/articles", payload),

  /**
   * FormData goes as POST with _method=PUT, not as a real PUT.
   *
   * PHP only parses a multipart body on POST — it populates $_FILES from
   * nothing else — so a PUT carrying a file arrives with the upload
   * missing and every other field empty.
   */
  update: (id: number, payload: Record<string, unknown> | FormData) => {
    if (payload instanceof FormData) {
      payload.append("_method", "PUT");

      return api.post<ApiEnvelope<AuthorArticle>>(`/author/articles/${id}`, payload);
    }

    return api.put<ApiEnvelope<AuthorArticle>>(`/author/articles/${id}`, payload);
  },

  remove: (id: number) =>
    api.delete<{ message: string }>(`/author/articles/${id}`),
};

export const seeker = {
  dashboard: () => api.get<ApiEnvelope<SeekerDashboard>>("/seeker/dashboard"),

  savedJobs: (params?: Record<string, string | number | undefined>) =>
    api.get<Paginated<SavedJob>>("/seeker/saved-jobs", params),

  saveJob: (jobId: number, note?: string) =>
    api.post<ApiEnvelope<SavedJob>>("/seeker/saved-jobs", {
      job_id: jobId,
      note,
    }),

  unsaveJob: (jobId: number) =>
    api.delete<{ message: string }>(`/seeker/saved-jobs/${jobId}`),

  /** Which of these jobs are saved — one request for a whole board of cards. */
  checkSaved: (jobIds: number[]) =>
    api.post<ApiEnvelope<number[]>>("/seeker/saved-jobs/check", {
      job_ids: jobIds,
    }),

  alerts: () => api.get<ApiEnvelope<JobAlert[]>>("/seeker/alerts"),

  createAlert: (payload: Record<string, unknown>) =>
    api.post<ApiEnvelope<JobAlert>>("/seeker/alerts", payload),

  updateAlert: (id: number, payload: Record<string, unknown>) =>
    api.put<ApiEnvelope<JobAlert>>(`/seeker/alerts/${id}`, payload),

  toggleAlert: (id: number) =>
    api.patch<ApiEnvelope<JobAlert>>(`/seeker/alerts/${id}/toggle`),

  deleteAlert: (id: number) =>
    api.delete<{ message: string }>(`/seeker/alerts/${id}`),
};

export const employerCompany = {
  get: () => api.get<{ data: EmployerCompany | null }>("/employer/company"),

  create: (payload: Record<string, unknown>) =>
    api.post<ApiEnvelope<EmployerCompany>>("/employer/company", payload),

  update: (id: number, payload: Record<string, unknown>) =>
    api.put<ApiEnvelope<EmployerCompany>>(`/employer/company/${id}`, payload),
};

export const seekerProfile = {
  get: () => api.get<ApiEnvelope<User>>("/seeker/profile"),

  update: (payload: Record<string, unknown>) =>
    api.put<ApiEnvelope<User>>("/seeker/profile", payload),

  resumes: () => api.get<ApiEnvelope<Resume[]>>("/seeker/resumes"),

  uploadResume: (file: File, title?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    return api.upload<ApiEnvelope<Resume>>("/seeker/resumes", form);
  },

  setDefaultResume: (id: number) =>
    api.patch<ApiEnvelope<Resume>>(`/seeker/resumes/${id}/default`),

  deleteResume: (id: number) =>
    api.delete<{ message: string }>(`/seeker/resumes/${id}`),
};

/**
 * The repeating CV sections.
 *
 * All five are the same shape — list, add, edit, remove, reorder — so the
 * client is generated from the segment name rather than written out five
 * times. A typo in one hand-written copy is exactly the sort of bug that
 * only shows up on the one section nobody clicked.
 */
function section<T>(segment: string) {
  return {
    list: () => api.get<ApiEnvelope<T[]>>(`/seeker/${segment}`),
    create: (payload: Record<string, unknown>) =>
      api.post<ApiEnvelope<T>>(`/seeker/${segment}`, payload),
    update: (id: number, payload: Record<string, unknown>) =>
      api.put<ApiEnvelope<T>>(`/seeker/${segment}/${id}`, payload),
    remove: (id: number) =>
      api.delete<{ message: string }>(`/seeker/${segment}/${id}`),
    reorder: (ids: number[]) =>
      api.put<{ message: string }>(`/seeker/${segment}/reorder`, { ids }),
  };
}

/** Headline, summary and what the candidate is looking for. */
export const seekerDetails = {
  get: () => api.get<ApiEnvelope<SeekerProfile>>("/seeker/seeker-profile"),
  update: (payload: Record<string, unknown>) =>
    api.put<ApiEnvelope<SeekerProfile>>("/seeker/seeker-profile", payload),
};

export const seekerExperiences = section<SeekerExperience>("experiences");
export const seekerEducations = section<SeekerEducation>("educations");
export const seekerCertificates = section<SeekerCertificate>("certificates");
export const seekerLanguages = section<SeekerLanguage>("languages");
export const seekerPortfolio = section<SeekerPortfolioItem>("portfolio");

/**
 * Skills are a pivot onto the shared taxonomy, so the whole set is replaced
 * at once rather than edited row by row.
 */
/**
 * Reader comments.
 *
 * Reading needs no session — the thread is part of the public page — so the
 * list call goes out unauthenticated and the API decides what a guest may do.
 */
export const comments = {
  list: (slug: string) =>
    api.get<{ data: PublicComment[]; meta: CommentThreadMeta }>(
      `/articles/${slug}/comments`,
    ),

  post: (
    slug: string,
    payload: {
      body: string;
      parent_id?: number | null;
      guest_name?: string;
      guest_email?: string;
    },
  ) =>
    api.post<{ message: string; data: PublicComment | null }>(
      `/articles/${slug}/comments`,
      payload,
    ),

  report: (id: number, reason: string, details?: string) =>
    api.post<{ message: string }>(`/comments/${id}/report`, {
      reason,
      details,
    }),
};

/** The moderation queue. Administrators only — it carries emails and IPs. */
export const adminComments = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    api.get<Paginated<AdminComment>>("/admin/comments", params),

  stats: () => api.get<ApiEnvelope<CommentStats>>("/admin/comments/stats"),

  setStatus: (id: number, status: string) =>
    api.patch<ApiEnvelope<AdminComment>>(`/admin/comments/${id}/status`, {
      status,
    }),

  remove: (id: number) =>
    api.delete<{ message: string }>(`/admin/comments/${id}`),
};

export const seekerSkills = {
  list: () => api.get<ApiEnvelope<SeekerSkill[]>>("/seeker/skills"),
  sync: (
    skills: {
      skill_id: number;
      proficiency?: string | null;
      years_experience?: number | null;
    }[],
  ) => api.put<ApiEnvelope<SeekerSkill[]>>("/seeker/skills", { skills }),
};

export const billing = {
  /** The plan catalogue. Public — a pricing page must be readable by guests. */
  plans: () => api.get<ApiEnvelope<Plan[]>>("/plans"),

  overview: () => api.get<ApiEnvelope<BillingOverview>>("/employer/billing"),

  subscribe: (plan: string) =>
    api.post<
      ApiEnvelope<{
        checkout_url: string | null;
        subscription?: CompanySubscription;
      }>
    >("/employer/billing/subscribe", { plan }),

  cancel: () =>
    api.post<ApiEnvelope<CompanySubscription>>("/employer/billing/cancel"),
};

export const newsletter = {
  subscribe: (email: string, name?: string) =>
    api.post<{ message: string }>("/newsletter/subscribe", { email, name }),

  confirm: (token: string) =>
    api.post<{ message: string }>("/newsletter/confirm", { token }),

  unsubscribe: (email: string) =>
    api.post<{ message: string }>("/newsletter/unsubscribe", { email }),
};
