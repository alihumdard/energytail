"use client";

import { useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import {
  Plus,
  Save,
  Info,
  ShieldCheck,
  Briefcase,
  Search,
  PenSquare,
  User,
  Check,
  Loader2,
} from "lucide-react";
import { adminRoles } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/useApiResource";
import type { Role } from "@/lib/api/types";

const DETAIL_TABS = ["Permissions", "Users"];

/** Icon and colour per seeded role; custom roles fall back to the last entry. */
const ROLE_VISUALS: Record<string, { icon: typeof ShieldCheck; color: string; bg: string }> = {
  administrator: { icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50" },
  employer: { icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
  job_seeker: { icon: Search, color: "text-orange-600", bg: "bg-orange-50" },
  author: { icon: PenSquare, color: "text-purple-600", bg: "bg-purple-50" },
  guest: { icon: User, color: "text-slate-400", bg: "bg-slate-100" },
};

const FALLBACK_VISUAL = { icon: User, color: "text-slate-500", bg: "bg-slate-100" };

export default function RolesPermissionsPage() {
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("Permissions");

  /**
   * Local edits to the grid, or null when nothing has been touched since the
   * role was loaded. Null means "show exactly what the server returned".
   */
  const [edits, setEdits] = useState<Set<string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: rolesResponse, loading: rolesLoading, refetch: refetchRoles } =
    useApiResource(() => adminRoles.list(), []);

  const { data: matrixResponse, loading: matrixLoading } = useApiResource(
    () => adminRoles.matrix(),
    [],
  );

  const roles = useMemo(() => rolesResponse?.data ?? [], [rolesResponse]);
  const matrix = matrixResponse?.data;

  // Falls back to the first role until one is chosen, rather than syncing a
  // default into state from an effect.
  const effectiveRoleId = activeRoleId ?? roles[0]?.id ?? null;
  const activeRole: Role | undefined = roles.find((r) => r.id === effectiveRoleId);

  const { data: roleDetail, loading: detailLoading } = useApiResource(
    () => (effectiveRoleId ? adminRoles.get(effectiveRoleId) : Promise.resolve(null)),
    [effectiveRoleId],
  );

  /*
   * The grid is edited locally and only written back on save, so the server's
   * permissions seed a working copy. `edits` holds that copy; while it is
   * null the server values are shown directly, which avoids copying them in
   * from an effect.
   */
  const serverPermissions = useMemo(
    () => new Set(roleDetail?.data?.permissions ?? []),
    [roleDetail],
  );

  const selected = edits ?? serverPermissions;

  const { data: roleUsers } = useApiResource(
    () =>
      effectiveRoleId && activeTab === "Users"
        ? adminRoles.users(effectiveRoleId, { per_page: 25 })
        : Promise.resolve(null),
    [effectiveRoleId, activeTab],
  );

  // The administrator role is deliberately locked: stripping it would leave
  // nobody able to administer the platform, and the API refuses the write.
  const locked = activeRole?.name === "administrator";

  /** Switching role discards any unsaved edits to the previous one. */
  function selectRole(id: number) {
    setActiveRoleId(id);
    setEdits(null);
    setSaved(false);
    setSaveError(null);
  }

  function toggle(permission: string) {
    if (locked) return;

    setEdits((prev) => {
      const next = new Set(prev ?? serverPermissions);
      if (next.has(permission)) {
        next.delete(permission);
      } else {
        next.add(permission);
      }
      return next;
    });
    setSaved(false);
  }

  async function save() {
    if (!effectiveRoleId) return;

    setSaving(true);
    setSaveError(null);

    try {
      // One request for the whole grid, matching the single Save button.
      await adminRoles.syncPermissions(effectiveRoleId, [...selected]);
      // Drop the working copy so the refreshed server values take over.
      setEdits(null);
      setSaved(true);
      refetchRoles();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save permissions.");
    } finally {
      setSaving(false);
    }
  }

  const actions = matrix?.actions ?? [];
  const modules = matrix?.modules ?? [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar active="roles" />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar variant="dark" />

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Roles &amp; Permissions</h1>
              <p className="text-sm text-slate-400 mt-1">
                Dashboard <span className="mx-1">&gt;</span>{" "}
                <span className="text-slate-600">Roles &amp; Permissions</span>
              </p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2.5 text-sm shrink-0">
              <Plus className="w-4 h-4" />
              Add New Role
            </button>
          </div>
          <p className="text-sm text-slate-500 -mt-4">
            Manage user roles and their permissions. Control what each role can access and modify
            across the platform.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
            {/* Roles list */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 px-1 mb-3">
                <span className="font-semibold text-slate-900">Roles</span>
                <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full">
                  {roles.length}
                </span>
              </div>

              {rolesLoading && (
                <div className="py-8 text-center text-sm text-slate-400">Loading roles…</div>
              )}

              <div className="space-y-1.5">
                {roles.map((r) => {
                  const isActive = r.id === effectiveRoleId;
                  const visual = ROLE_VISUALS[r.name] ?? FALLBACK_VISUAL;
                  const Icon = visual.icon;

                  return (
                    <button
                      key={r.id}
                      onClick={() => selectRole(r.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                        isActive
                          ? "bg-blue-50 border border-blue-100"
                          : "border border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg ${visual.bg} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`w-[18px] h-[18px] ${visual.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-semibold ${isActive ? "text-blue-600" : "text-slate-800"}`}
                        >
                          {r.label}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{r.description}</div>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          r.is_system
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {r.is_system ? "System" : (r.users_count ?? 0).toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button className="w-full flex items-center justify-center gap-2 mt-3 border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm font-medium text-slate-500 hover:bg-slate-50">
                <Plus className="w-4 h-4" />
                Add New Role
              </button>
            </div>

            {/* Detail panel */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap px-5 border-b border-slate-100">
                {DETAIL_TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === t
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {activeRole?.label ?? "Role"} Permissions
                    </h2>
                    <p className="text-sm text-slate-400 mt-0.5">
                      Define what actions the {activeRole?.label ?? "selected"} role can perform.
                    </p>
                  </div>

                  {activeTab === "Permissions" && (
                    <div className="flex items-center gap-2.5 shrink-0">
                      {saved && (
                        <span className="text-sm font-medium text-emerald-600">Saved</span>
                      )}
                      <button
                        onClick={save}
                        disabled={saving || locked || detailLoading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2 text-sm"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                {saveError && (
                  <div
                    role="alert"
                    className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {saveError}
                  </div>
                )}

                {locked && activeTab === "Permissions" && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    The Administrator role always holds every permission and cannot be edited —
                    otherwise the platform could be left with nobody able to administer it.
                  </div>
                )}

                {activeTab === "Permissions" && (
                  <div className="mt-5 overflow-x-auto">
                    {matrixLoading || detailLoading ? (
                      <div className="py-12 text-center text-sm text-slate-400">
                        Loading permissions…
                      </div>
                    ) : (
                      <table className="w-full text-sm min-w-[600px]">
                        <thead>
                          <tr className="text-left text-slate-400 border-b border-slate-100">
                            <th className="py-3 font-medium">Modules</th>
                            {actions.map((a) => (
                              <th
                                key={a.key}
                                title={a.description}
                                className="py-3 font-medium text-center w-[11%]"
                              >
                                {a.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {modules.map((m) => (
                            <tr key={m.key} className="border-b border-slate-50 last:border-0">
                              <td className="py-3.5 pr-3">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <div className="font-medium text-slate-800">{m.label}</div>
                                    <div className="text-xs text-slate-400">{m.description}</div>
                                  </div>
                                </div>
                              </td>
                              {actions.map((a) => {
                                const cell = m.actions[a.key];

                                // An unavailable cell means the action does not
                                // apply to this module — an audit log cannot be
                                // edited — so it shows a dash, not a checkbox.
                                if (!cell?.available || !cell.permission) {
                                  return (
                                    <td key={a.key} className="text-center">
                                      <span className="text-slate-300">—</span>
                                    </td>
                                  );
                                }

                                const checked = locked || selected.has(cell.permission);

                                return (
                                  <td key={a.key} className="text-center">
                                    <button
                                      type="button"
                                      onClick={() => toggle(cell.permission!)}
                                      disabled={locked}
                                      aria-pressed={checked}
                                      aria-label={`${a.label} ${m.label}`}
                                      className={`w-5 h-5 rounded-md inline-flex items-center justify-center transition-colors ${
                                        checked ? "bg-blue-600" : "border border-slate-300 hover:border-blue-400"
                                      } ${locked ? "opacity-60 cursor-not-allowed" : ""}`}
                                    >
                                      {checked && (
                                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                      )}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === "Users" && (
                  <div className="mt-5">
                    {!roleUsers || roleUsers.data.length === 0 ? (
                      <p className="py-12 text-center text-sm text-slate-400">
                        No users hold this role.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-50">
                        {roleUsers.data.map((u) => (
                          <li key={u.id} className="flex items-center gap-3 py-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-500">
                              {u.full_name
                                .split(" ")
                                .map((w) => w[0])
                                .filter(Boolean)
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-800 truncate">
                                {u.full_name}
                              </div>
                              <div className="text-xs text-slate-400 truncate">{u.email}</div>
                            </div>
                            <span
                              className={`ml-auto text-xs font-medium ${u.status === "active" ? "text-emerald-600" : "text-red-500"}`}
                            >
                              {u.status === "active" ? "Active" : "Suspended"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {activeTab === "Permissions" && (
                  <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-800">About Permissions</span>
                      <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
                        {actions.map((a) => (
                          <span key={a.key}>
                            <span className="font-semibold text-slate-700">{a.label}:</span>{" "}
                            {a.description}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>© 2026 Energy Tail. All rights reserved.</span>
            <span>Version 1.0.0</span>
          </div>
        </main>
      </div>
    </div>
  );
}
