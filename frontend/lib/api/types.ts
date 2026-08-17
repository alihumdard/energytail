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
  // City
  country?: { id: number; name: string; code: string; flag_emoji: string | null } | null;
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
