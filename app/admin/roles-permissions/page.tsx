"use client";

import { useState } from "react";
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
  ChevronDown,
} from "lucide-react";

const roles = [
  { key: "administrator", name: "Administrator", desc: "Full access to all features", badge: "System", count: null, icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50" },
  { key: "employer", name: "Employer", desc: "Manage company and jobs", badge: "124", count: "124", icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "jobseeker", name: "Job Seeker", desc: "Search and apply for jobs", badge: "3,246", count: "3,246", icon: Search, color: "text-orange-600", bg: "bg-orange-50" },
  { key: "author", name: "Article Author", desc: "Create and manage articles", badge: "89", count: "89", icon: PenSquare, color: "text-purple-600", bg: "bg-purple-50" },
  { key: "guest", name: "Guest", desc: "Limited public access", badge: "0", count: "0", icon: User, color: "text-slate-400", bg: "bg-slate-100" },
];

const detailTabs = ["Role Details", "Permissions", "Users", "Activity Log"];

const columns = ["View", "Add", "Edit", "Delete", "Approve", "Export", "Settings"];

const modules = [
  { name: "Dashboard", desc: "View dashboard and analytics", icon: "🏠", perms: [true, true, true, true, true, true, true] },
  { name: "Users", desc: "Manage platform users", icon: "👥", perms: [true, true, true, true, true, true, true] },
  { name: "Companies", desc: "Manage companies", icon: "🏢", perms: [true, true, true, true, true, true, true] },
  { name: "Jobs", desc: "Manage job listings", icon: "💼", perms: [true, true, true, true, true, true, true] },
  { name: "Articles", desc: "Manage articles and content", icon: "📄", perms: [true, true, true, true, true, true, true] },
  { name: "Categories", desc: "Manage categories & taxonomy", icon: "🗂️", perms: [true, true, true, true, true, true, true] },
  { name: "Settings", desc: "Manage system settings", icon: "⚙️", perms: [true, true, true, true, true, true, true] },
  { name: "Roles & Permissions", desc: "Manage roles and permissions", icon: "🛡️", perms: [true, true, true, null, null, true, true] },
  { name: "Audit Logs", desc: "View audit logs", icon: "📋", perms: [true, null, null, null, null, null, null] },
];

function ModuleIcon({ icon }: { icon: string }) {
  return <span className="text-base leading-none">{icon}</span>;
}

export default function RolesPermissionsPage() {
  const [activeRole, setActiveRole] = useState("administrator");
  const [activeTab, setActiveTab] = useState("Permissions");
  const role = roles.find((r) => r.key === activeRole)!;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar active="roles" />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar variant="dark" />

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Roles &amp; Permissions</h1>
              <p className="text-sm text-slate-400 mt-1">
                Dashboard <span className="mx-1">&gt;</span> <span className="text-slate-600">Roles &amp; Permissions</span>
              </p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2.5 text-sm shrink-0">
              <Plus className="w-4 h-4" />
              Add New Role
            </button>
          </div>
          <p className="text-sm text-slate-500 -mt-4">
            Manage user roles and their permissions. Control what each role can access and modify across the platform.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
            {/* Roles list */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 px-1 mb-3">
                <span className="font-semibold text-slate-900">Roles</span>
                <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full">{roles.length}</span>
              </div>
              <div className="space-y-1.5">
                {roles.map((r) => {
                  const isActive = r.key === activeRole;
                  return (
                    <button
                      key={r.key}
                      onClick={() => setActiveRole(r.key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                        isActive ? "bg-blue-50 border border-blue-100" : "border border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg ${r.bg} flex items-center justify-center shrink-0`}>
                        <r.icon className={`w-[18px] h-[18px] ${r.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${isActive ? "text-blue-600" : "text-slate-800"}`}>{r.name}</div>
                        <div className="text-xs text-slate-400 truncate">{r.desc}</div>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          r.badge === "System" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {r.badge}
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
                {detailTabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{role.name} Permissions</h2>
                    <p className="text-sm text-slate-400 mt-0.5">Define what actions the {role.name} role can perform.</p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg px-3.5 py-2">
                      All Permissions
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 text-sm">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-100">
                        <th className="py-3 font-medium">Modules</th>
                        {columns.map((c) => (
                          <th key={c} className="py-3 font-medium text-center w-[11%]">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((m) => (
                        <tr key={m.name} className="border-b border-slate-50 last:border-0">
                          <td className="py-3.5 pr-3">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                <ModuleIcon icon={m.icon} />
                              </span>
                              <div>
                                <div className="font-medium text-slate-800">{m.name}</div>
                                <div className="text-xs text-slate-400">{m.desc}</div>
                              </div>
                            </div>
                          </td>
                          {m.perms.map((checked, i) => (
                            <td key={i} className="text-center">
                              {checked === null ? (
                                <span className="text-slate-300">—</span>
                              ) : (
                                <button
                                  className={`w-5 h-5 rounded-md inline-flex items-center justify-center ${
                                    checked ? "bg-blue-600" : "border border-slate-300"
                                  }`}
                                >
                                  {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                </button>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-800">About Permissions</span>
                    <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
                      <span><span className="font-semibold text-slate-700">View:</span> Can view the module</span>
                      <span><span className="font-semibold text-slate-700">Add:</span> Can create new records</span>
                      <span><span className="font-semibold text-slate-700">Edit:</span> Can edit existing records</span>
                      <span><span className="font-semibold text-slate-700">Delete:</span> Can delete records</span>
                      <span><span className="font-semibold text-slate-700">Approve:</span> Can approve/reject records</span>
                      <span><span className="font-semibold text-slate-700">Export:</span> Can export data</span>
                      <span><span className="font-semibold text-slate-700">Settings:</span> Can manage module settings</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>© 2025 Energy Tail. All rights reserved.</span>
            <span>Version 1.0.0</span>
          </div>
        </main>
      </div>
    </div>
  );
}
