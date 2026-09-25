/**
 * Shapes returned by the Laravel API.
 *
 * These mirror the API Resources in app/Http/Resources and the transform()
 * methods on the taxonomy controllers. Where the two disagree the backend
 * wins — it is the source of truth.
 */

export interface User {
  id: number;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: "active" | "suspended";
  email_verified: boolean;
  locale: string;
  timezone: string | null;
  roles: string[];
  permissions: string[];
  last_login_at: string | null;
  created_at: string | null;
}

export interface Role {
  id: number;
  name: string;
  label: string;
  description: string | null;
  is_system: boolean;
  sort_order: number;
  users_count?: number;
  permissions_count?: number;
  permissions?: string[];
  created_at: string | null;
}

/** One cell of the permission matrix. */
export interface MatrixCell {
  /** false renders as "—": the action does not apply to this module. */
  available: boolean;
  permission: string | null;
}

export interface MatrixModule {
  key: string;
  label: string;
  description: string | null;
  actions: Record<string, MatrixCell>;
}

export interface PermissionMatrix {
  actions: { key: string; label: string; description: string }[];
  modules: MatrixModule[];
}

export interface TaxonomyItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  emoji?: string | null;
  icon?: string | null;
  color?: string | null;
  is_active: boolean;
  sort_order?: number;
  jobs_count?: number | null;
  articles_count?: number | null;
  usage_count?: number;
  // Country
  code?: string;
  flag_emoji?: string | null;
  region?: string | null;
  // City — the key as well as the expanded relation, so an edit form has
  // something to pre-select in the country dropdown.
  country_id?: number | null;
  country?: {
    id: number;
    name: string;
    code: string;
    flag_emoji: string | null;
  } | null;
  // Skill
  category?: string | null;
  demand_level?: string;
  // Job category
  parent_id?: number | null;
  is_featured?: boolean;
}

export interface DonutSlice {
  label: string;
  value: number;
  pct: number;
  color: string;
}

export interface RankedItem {
  label: string;
  value: number;
  rank?: number;
}

export interface TaxonomyStats {
  stats: Record<string, number>;
  donut: DonutSlice[];
  top: RankedItem[];
}

export interface AuditLogEntry {
  id: number;
  date: string | null;
  time: string | null;
  timestamp: string | null;
  user: string | null;
  user_id: number | null;
  role: string | null;
  action: string | null;
  module: string | null;
  description: string;
  subject_type: string | null;
  subject_id: number | null;
  ip: string | null;
  status: "success" | "pending" | "failed";
  properties: unknown;
}

export interface SettingItem {
  key: string;
  value: unknown;
  type: string;
  is_public: boolean;
  description: string | null;
}

/** Outgoing-mail diagnostics for the settings screen. */
export interface MailHealth {
  mailer: string;
  host: string | null;
  from: string | null;
  /** False for the 'log' mailer, which writes to a file instead of sending. */
  delivers: boolean;
  queue: {
    pending: number;
    failed: number;
    last_failure: { failed_at: string; reason: string } | null;
  };
}

/** A named taxonomy reference as the public job payloads carry it. */
export interface NamedRef {
  name: string;
  slug: string;
}

export interface JobSalary {
  /*
   * Strings, not numbers: these are Postgres decimal columns and PHP
   * serialises them as "90000.00" to avoid float rounding. Typing them as
   * number would be a lie that compiles — arithmetic on them silently
   * concatenates instead of adding. Parse before doing maths.
   */
  min: number | string | null;
  max: number | string | null;
  currency: string | null;
  period: string | null;
}

/** The fields a job card needs — what the listing endpoint returns. */
export interface JobSummary {
  id: number;
  title: string;
  slug: string;
  /** Plain-text opening of the description, already cut to ~200 chars by
   *  the API so a 15-job page does not ship fifteen full descriptions. */
  excerpt: string | null;
  /** The employer's own image. Null falls back to a category photo. */
  featured_image_path: string | null;
  skills: NamedRef[];
  employment_type: string | null;
  is_remote: boolean;
  is_featured: boolean;
  is_urgent: boolean;
  location_label: string | null;
  experience_min: number | null;
  experience_max: number | null;
  /** Null when the employer chose to withhold it. */
  salary: JobSalary | null;
  published_at: string | null;
  deadline_at: string | null;
  views_count: number;
  company: {
    name: string;
    slug: string;
    logo_path: string | null;
    is_verified: boolean;
  } | null;
  category: NamedRef | null;
  industry: NamedRef | null;
  country: (NamedRef & { code: string; flag_emoji: string | null }) | null;
  city: NamedRef | null;
}

/**
 * A job detail page's payload.
 *
 * Deliberately carries no apply_url: the destination comes only from the
 * apply endpoint, which records the click first.
 */
export interface JobDetail extends JobSummary {
  reference: string | null;
  description: string | null;
  responsibilities: string | null;
  requirements: string | null;
  benefits: string | null;
  apply_method: string | null;
  skills: NamedRef[];
  tags: (NamedRef & { color: string | null })[];
  company_profile: {
    website: string | null;
    description: string | null;
    cover_path: string | null;
  } | null;
  meta_title: string | null;
  meta_description: string | null;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

/** A job as its owning employer sees it — includes drafts and performance. */
export interface EmployerJob {
  id: number;
  reference: string | null;
  title: string;
  slug: string;
  status: string;
  /** The employer's uploaded image, if they added one. */
  featured_image_path?: string | null;
  employment_type: string | null;
  is_remote: boolean;
  is_featured: boolean;
  location_label: string | null;
  views_count: number;
  apply_clicks_count: number;
  published_at: string | null;
  deadline_at: string | null;
  created_at: string | null;
  company: { id: number; name: string } | null;
  // Present only on the detail response, which the edit form loads.
  job_category_id?: number | null;
  industry_id?: number | null;
  country_id?: number | null;
  city_id?: number | null;
  description?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  experience_min?: number | null;
  experience_max?: number | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
  salary_is_hidden?: boolean;
  apply_method?: string | null;
  apply_url?: string | null;
  apply_email?: string | null;
  skills?: number[];
}

export interface EmployerJobStats {
  total: number;
  published: number;
  draft: number;
  pending_review: number;
  expired: number;
  closed: number;
  /** What an employer gets in place of applicant tracking. */
  views: number;
  apply_clicks: number;
}

/** A job as an administrator sees it — every company, every status. */
export interface AdminJob {
  id: number;
  reference: string | null;
  title: string;
  slug: string;
  status: string;
  employment_type: string | null;
  is_remote: boolean;
  is_featured: boolean;
  is_urgent: boolean;
  location_label: string | null;
  views_count: number;
  apply_clicks_count: number;
  published_at: string | null;
  deadline_at: string | null;
  created_at: string | null;
  company: { id: number; name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  country: { name: string; code: string } | null;
  city: { name: string } | null;
}

/** A company as an administrator sees it — every status, verified or not. */
export interface AdminCompany {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: string;
  is_verified: boolean;
  is_featured: boolean;
  logo_path: string | null;
  company_size: string | null;
  founded_year: number | null;
  /** Counted live, not read from the drifted jobs_count column. */
  jobs_count: number;
  created_at: string | null;
  verified_at: string | null;
  owner: { id: number; name: string; email: string } | null;
  industry: { id: number; name: string } | null;
  country: { id: number; name: string; code: string } | null;
  city: { id: number; name: string } | null;
  // Present only on the detail response.
  description?: string | null;
  address?: string | null;
  industry_id?: number | null;
  country_id?: number | null;
  city_id?: number | null;
}

/** An article as a moderator sees it — every status, every author. */
export interface AdminArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  is_featured: boolean;
  is_sponsored: boolean;
  reading_minutes: number | null;
  views_count: number;
  comments_count: number;
  featured_image_path: string | null;
  published_at: string | null;
  created_at: string | null;
  reviewed_at: string | null;
  /** Why a piece was sent back. Travels with the article so the author can read it. */
  review_notes: string | null;
  author: { id: number; name: string; email: string } | null;
  category: { id: number; name: string; slug: string } | null;
  reviewer: { id: number; name: string } | null;
  // Present only on the detail response.
  body?: string | null;
  article_category_id?: number | null;
  comments_enabled?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
}

/** An article as the public feed shows it. */
export interface PublicArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_path: string | null;
  reading_minutes: number | null;
  views_count: number;
  comments_count: number;
  is_featured: boolean;
  is_sponsored: boolean;
  published_at: string | null;
  author: { name: string } | null;
  category: { name: string; slug: string } | null;
  // Present only on the detail response.
  body?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  comments_enabled?: boolean;
}

/** The administrator's platform overview, counted at request time. */
export interface AdminDashboard {
  totals: {
    users: number;
    companies: number;
    jobs: number;
    published_jobs: number;
    articles: number;
    published_articles: number;
    /** Views and clicks, not applications — candidates apply off-platform. */
    job_views: number;
    apply_clicks: number;
    article_views: number;
  };
  moderation: {
    jobs_pending: number;
    articles_pending: number;
    companies_pending: number;
    suspended_users: number;
    unverified_companies: number;
  };
  jobsByCategory: {
    label: string;
    value: number;
    pct: number;
    color: string;
  }[];
  topCountries: {
    label: string;
    code: string;
    flag: string | null;
    value: number;
    max: number;
  }[];
  usersByRole: { role: string; label: string; value: number }[];
  recentActivity: {
    id: number;
    module: string | null;
    action: string | null;
    description: string | null;
    user: string | null;
    created_at: string | null;
  }[];
}

/** An article as its author sees it, in their own workspace. */
export interface AuthorArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  is_featured: boolean;
  reading_minutes: number | null;
  views_count: number;
  comments_count: number;
  published_at: string | null;
  created_at: string | null;
  reviewed_at: string | null;
  /** Why a piece was sent back — the author reads this to fix it. */
  review_notes: string | null;
  category: { id: number; name: string } | null;
  reviewer: { name: string } | null;
  // Present only on the detail response.
  body?: string | null;
  article_category_id?: number | null;
  /** The author's uploaded lead image, if they added one. */
  featured_image_path?: string | null;
  featured_image_alt?: string | null;
  /** Tag ids, for the form to pre-select. */
  tags?: number[];
  comments_enabled?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface AuthorArticleStats {
  total: number;
  published: number;
  draft: number;
  pending_review: number;
  rejected: number;
  scheduled: number;
  /** Likes and bookmarks have no tables, so they are not reported. */
  views: number;
  comments: number;
}

/** A company as the public directory shows it. */
export interface PublicCompany {
  id: number;
  name: string;
  slug: string;
  website: string | null;
  logo_path: string | null;
  company_size: string | null;
  founded_year: number | null;
  is_verified: boolean;
  is_featured: boolean;
  /** Published jobs only, counted live. */
  open_jobs: number;
  industry: { name: string; slug: string } | null;
  country: { name: string; code: string } | null;
  city: { name: string } | null;
  // Present only on the detail response. Email and phone are never published.
  description?: string | null;
  address?: string | null;
  cover_path?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  socials?: { platform: string; url: string }[];
}

/** A vacancy as a company's profile page lists it. */
export interface CompanyJob {
  id: number;
  title: string;
  slug: string;
  employment_type: string | null;
  is_remote: boolean;
  is_featured: boolean;
  location_label: string | null;
  published_at: string | null;
  deadline_at: string | null;
  category: { name: string; slug: string } | null;
  country: { name: string; code: string } | null;
  city: { name: string } | null;
}

/** A job the candidate saved. */
export interface SavedJob {
  id: number;
  note: string | null;
  saved_at: string | null;
  job: {
    id: number;
    title: string;
    slug: string;
    status: string;
    /** Whether the listing is still live — a saved job can close. */
    is_open: boolean;
    employment_type: string | null;
    is_remote: boolean;
    location_label: string | null;
    published_at: string | null;
    deadline_at: string | null;
    company: { name: string; slug: string } | null;
  } | null;
}

/** A stored search with a delivery frequency. */
export interface JobAlert {
  id: number;
  name: string;
  keywords: string | null;
  employment_type: string | null;
  is_remote: boolean;
  salary_min: string | null;
  frequency: string;
  is_active: boolean;
  last_sent_at: string | null;
  created_at: string | null;
  job_category_id: number | null;
  industry_id: number | null;
  country_id: number | null;
  city_id: number | null;
  category: { name: string } | null;
  industry: { name: string } | null;
  country: { name: string; code: string } | null;
  city: { name: string } | null;
}

export interface SeekerDashboard {
  stats: {
    saved_jobs: number;
    saved_open: number;
    saved_closed: number;
    alerts: number;
    active_alerts: number;
    /**
     * Applications the candidate started — a click through to the employer.
     * The platform cannot see what happened after that.
     */
    applications_started: number;
    applications_this_month: number;
  };
  profile: { completion: number; missing: string[] };
}

/** The employer's own company, as their profile form sees it. */
export interface EmployerCompany {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  company_size: string | null;
  founded_year: number | null;
  logo_path: string | null;
  status: string;
  is_verified: boolean;
  is_featured: boolean;
  jobs_count: number;
  published_jobs_count: number;
  industry_id: number | null;
  country_id: number | null;
  city_id: number | null;
  meta_title: string | null;
  meta_description: string | null;
  industry: { id: number; name: string } | null;
  country: { id: number; name: string } | null;
  city: { id: number; name: string } | null;
  /** Whether the profile is on the public directory yet. */
  is_listed: boolean;
}

/** A CV the candidate has uploaded. The storage path never leaves the server. */
export interface Resume {
  id: number;
  title: string | null;
  original_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  is_default: boolean;
  created_at: string | null;
}

/** A plan an employer can buy. Prices are in cents, never floats. */
export interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  interval: string;
  /** null means unlimited, which is not the same as 0. */
  job_limit: number | null;
  featured_job_limit: number;
  job_duration_days: number;
  is_popular: boolean;
  is_free: boolean;
}

export interface CompanySubscription {
  id: number;
  status: string;
  is_valid: boolean;
  on_grace_period: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  cancels_at: string | null;
  jobs_used: number;
  jobs_remaining: number | null;
  featured_used: number;
  featured_remaining: number;
  plan: Plan | null;
}

export interface BillingPayment {
  id: number;
  amount_cents: number;
  currency: string;
  status: string;
  failure_reason: string | null;
  invoice_url: string | null;
  invoice_pdf_url: string | null;
  paid_at: string | null;
  created_at: string | null;
}

export interface BillingOverview {
  company: { id: number; name: string } | null;
  subscription: CompanySubscription | null;
  payments: BillingPayment[];
  /** Whether payments can be taken at all, so the UI can explain itself. */
  stripe_ready: boolean;
}

/** Everything the homepage needs, in one payload. */
export interface HomePayload {
  stats: {
    jobs: number;
    companies: number;
    countries: number;
    articles: number;
  };
  categories: {
    name: string;
    slug: string;
    emoji: string | null;
    color: string | null;
    jobs_count: number;
  }[];
  featured_jobs: {
    id: number;
    title: string;
    slug: string;
    employment_type: string | null;
    is_remote: boolean;
    is_featured: boolean;
    is_urgent: boolean;
    location_label: string | null;
    published_at: string | null;
    /** Null when the employer hid the salary — omitted, not just unrendered. */
    salary_min: string | number | null;
    salary_max: string | number | null;
    salary_currency: string | null;
    salary_period: string | null;
    company: { name: string; slug: string; logo_path: string | null } | null;
    category: { name: string; slug: string } | null;
    country: { name: string; code: string } | null;
    city: { name: string } | null;
  }[];
  companies: {
    name: string;
    slug: string;
    logo_path: string | null;
    is_verified: boolean;
    open_jobs: number;
  }[];
  articles: {
    title: string;
    slug: string;
    excerpt: string | null;
    featured_image_path: string | null;
    reading_minutes: number | null;
    published_at: string | null;
    author: { name: string } | null;
    category: { name: string; slug: string } | null;
  }[];
}

// ------------------------------------------------------- seeker profile

/** The candidate's professional profile — separate from their account. */
export interface SeekerProfile {
  headline: string | null;
  summary: string | null;
  country_id: number | null;
  city_id: number | null;
  job_category_id: number | null;
  industry_id: number | null;
  experience_years: number | null;
  /** Decimal columns: the API sends these as strings. Parse before maths. */
  expected_salary_min: number | string | null;
  expected_salary_max: number | string | null;
  expected_salary_currency: string | null;
  salary_period: string | null;
  availability: string | null;
  open_to_remote: boolean;
  open_to_relocation: boolean;
  website: string | null;
  linkedin_url: string | null;
  visibility: string;
  /** 0-100, for the "complete your profile" nudge. */
  completeness: number;
}

export interface SeekerExperience {
  id: number;
  job_title: string;
  company_name: string;
  location: string | null;
  employment_type: string | null;
  started_on: string | null;
  ended_on: string | null;
  is_current: boolean;
  description: string | null;
  sort_order: number;
}

export interface SeekerEducation {
  id: number;
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  grade: string | null;
  started_on: string | null;
  ended_on: string | null;
  is_current: boolean;
  description: string | null;
  sort_order: number;
}

export interface SeekerCertificate {
  id: number;
  name: string;
  issuer: string | null;
  credential_id: string | null;
  credential_url: string | null;
  issued_on: string | null;
  expires_on: string | null;
  /** Computed server-side — a stored flag would be wrong the next day. */
  is_expired: boolean;
  sort_order: number;
}

export interface SeekerLanguage {
  id: number;
  language: string;
  proficiency: string | null;
  sort_order: number;
}

export interface SeekerPortfolioItem {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  image_path: string | null;
  completed_on: string | null;
  sort_order: number;
}

export interface SeekerSkill {
  skill_id: number;
  name: string;
  slug: string;
  proficiency: string | null;
  years_experience: number | null;
}

// ------------------------------------------------------------- comments

/** One comment in the public thread. Replies are one level deep. */
export interface PublicComment {
  id: number;
  body: string;
  author: string;
  /** Marks a registered reader, so a guest cannot pass as one by name. */
  is_member: boolean;
  avatar_path: string | null;
  created_at: string | null;
  replies: PublicComment[];
}

export interface CommentThreadMeta {
  total: number;
  /** False when the article or the site has comments switched off. */
  enabled: boolean;
  guests_allowed: boolean;
  /** True when new comments are held for approval before they appear. */
  moderated: boolean;
}

/** A comment as the moderation queue shows it — carries email and IP. */
export interface AdminComment {
  id: number;
  body: string;
  status: string;
  author: string;
  is_member: boolean;
  email: string | null;
  ip_address: string | null;
  reports_count: number;
  is_reply: boolean;
  article: { id: number; title: string; slug: string } | null;
  created_at: string | null;
  moderated_at: string | null;
}

export interface CommentStats {
  total: number;
  pending: number;
  approved: number;
  spam: number;
  rejected: number;
  reported: number;
}
