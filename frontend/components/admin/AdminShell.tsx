"use client";

import RequireRole from "@/components/auth/RequireRole";
import AdminSidebar, { type AdminNavKey } from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

/**
 * The frame every admin screen sits in.
 *
 * The same eight lines of sidebar-plus-topbar scaffolding were repeated in
 * ten pages, which is how they drifted: the main element had picked up three
 * different padding recipes, and the theme toggle appeared on four screens
 * for no reason anyone could point at. Owning the frame here means a change
 * to the chrome is one edit rather than ten.
 *
 * It also owns the access check, for the same reason: every admin screen goes
 * through here, so no page can be added later that forgets it.
 *
 * The gate is the permission, not the role name. A custom role built in the
 * admin panel and granted dashboard.view belongs here too, and the sidebar
 * shows it only the modules its own permissions cover.
 */
export default function AdminShell({
  active,
  children,
}: {
  active: AdminNavKey;
  children: React.ReactNode;
}) {
  return (
    <RequireRole permission="dashboard.view">
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar active={active} />

        {/* min-w-0 so a wide table scrolls inside main instead of stretching it. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar variant="dark" />

          <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </RequireRole>
  );
}
