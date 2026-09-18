"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Keeps a workspace to the roles it belongs to.
 *
 * proxy.ts can only see whether a session cookie exists — reading roles there
 * would mean an API call before every page render. So a signed-in job seeker
 * could open /admin/dashboard, get the full admin chrome, and watch every
 * panel fail with "This action is unauthorized" as the API correctly refused
 * each request.
 *
 * Nothing was ever exposed: the API is the security boundary and it held.
 * This is about the screen telling the truth about what someone can do,
 * rather than showing them a dashboard that cannot work.
 */
export default function RequireRole({
  roles,
  permission,
  children,
}: {
  /** Any one of these roles is enough. Omit when gating on a permission. */
  roles?: string[];
  /**
   * A permission that grants access regardless of role name.
   *
   * Preferred over `roles` for anything the client can reconfigure: a custom
   * role built in the admin panel should reach the screens its permissions
   * allow, and checking for the literal name "administrator" would shut it
   * out no matter what it was granted.
   */
  permission?: string;
  children: React.ReactNode;
}) {
  const { user, loading, hasRole, can } = useAuth();
  const router = useRouter();

  const allowed =
    (permission !== undefined && can(permission)) ||
    (roles !== undefined && roles.length > 0 && hasRole(...roles));

  useEffect(() => {
    // Send a guest to sign in; proxy.ts normally catches this first, but the
    // session can expire while the page is open.
    if (!loading && user === null) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  if (user === null) return null;

  /*
   * Signed in, wrong workspace. Shown rather than redirected: a silent bounce
   * to their own dashboard looks like a broken link, while this says what
   * happened and offers the way back.
   */
  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-slate-300" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            This area is not open to your account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            You are signed in as {user.full_name || user.email}, which does not
            have access to this workspace.
          </p>
          <Link
            href={homeFor(user.roles, user.permissions)}
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to your dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Where this account's own workspace lives.
 *
 * Mirrors the post-login redirect. A custom role owns no workspace of its
 * own, so it is sent to the first admin screen its permissions cover rather
 * than to a seeker dashboard it cannot open either.
 */
function homeFor(roles: string[], permissions: string[]): string {
  if (roles.includes("administrator")) return "/admin/dashboard";
  if (roles.includes("employer")) return "/employer-dashboard";
  if (roles.includes("author")) return "/author-dashboard";
  if (roles.includes("job_seeker")) return "/dashboard";

  const admin: [string, string][] = [
    ["users.view", "/admin/dashboard"],
    ["companies.approve", "/admin/companies"],
    ["jobs.approve", "/admin/jobs"],
    ["articles.approve", "/admin/articles"],
    ["comments.approve", "/admin/comments"],
    ["taxonomy.view", "/admin/job-categories"],
    ["roles.view", "/admin/roles-permissions"],
    ["settings.view", "/admin/settings"],
    ["audit_logs.view", "/admin/audit-logs"],
  ];

  const match = admin.find(([permission]) => permissions.includes(permission));

  return match ? match[1] : "/";
}
