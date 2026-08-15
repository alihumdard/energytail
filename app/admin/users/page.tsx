"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import {
  Plus,
  Download,
  Search,
  Eye,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  UserRound,
  Building2,
  FileText,
  ShieldCheck,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const tabs = ["All Users", "Job Seekers", "Employers", "Article Authors", "Administrators"];

const summaryCards = [
  { label: "Total Users", value: "2,846", change: "+18.6%", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Job Seekers", value: "1,932", change: "+15.2%", icon: UserRound, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Employers", value: "712", change: "+12.8%", icon: Building2, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Article Authors", value: "156", change: "+9.4%", icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
  { label: "Administrators", value: "46", change: "+6.1%", icon: ShieldCheck, color: "text-red-500", bg: "bg-red-50" },
];

const users = [
  { name: "Michael Brown", email: "michael.brown@example.com", role: "Job Seeker", status: "Active", verified: true, joined: "May 18, 2025 10:30 AM", active: "2 hours ago" },
  { name: "Sarah Johnson", email: "sarah.johnson@example.com", role: "Job Seeker", status: "Active", verified: true, joined: "May 17, 2025 04:15 PM", active: "1 day ago" },
  { name: "PetroEnergy Solutions", email: "hr@petroenergy.com", role: "Employer", status: "Active", verified: true, joined: "May 16, 2025 11:20 AM", active: "3 hours ago" },
  { name: "Global Oil Services", email: "careers@gos.com", role: "Employer", status: "Active", verified: true, joined: "May 15, 2025 09:45 AM", active: "5 hours ago" },
  { name: "Emily Davis", email: "emily.davis@example.com", role: "Job Seeker", status: "Inactive", verified: false, joined: "May 14, 2025 02:30 PM", active: "2 weeks ago" },
  { name: "John Smith", email: "john.smith@example.com", role: "Article Author", status: "Active", verified: true, joined: "May 14, 2025 10:05 AM", active: "1 day ago" },
  { name: "Lisa Wilson", email: "lisa.wilson@example.com", role: "Article Author", status: "Active", verified: true, joined: "May 13, 2025 01:15 PM", active: "3 days ago" },
  { name: "Admin User", email: "admin@energytail.com", role: "Administrator", status: "Active", verified: true, joined: "May 10, 2025 09:00 AM", active: "Now" },
];

const roleStyle: Record<string, string> = {
  "Job Seeker": "bg-emerald-50 text-emerald-600",
  Employer: "bg-blue-50 text-blue-600",
  "Article Author": "bg-orange-50 text-orange-600",
  Administrator: "bg-red-50 text-red-600",
};

const pieData = [
  { name: "Job Seekers", value: 1932, color: "#10b981" },
  { name: "Employers", value: 712, color: "#2563eb" },
  { name: "Article Authors", value: 156, color: "#f59e0b" },
  { name: "Administrators", value: 46, color: "#ef4444" },
];

export default function UsersManagementPage() {
  const [activeTab, setActiveTab] = useState("All Users");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar active="users" />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar variant="dark" showThemeToggle />

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Users Management</h1>
              <p className="text-sm text-slate-500 mt-1">
                <span className="text-slate-400">Dashboard</span> &gt; Users
              </p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2.5 text-sm shrink-0">
              <Plus className="w-4 h-4" />
              Add New User
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-slate-100 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  activeTab === t
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {summaryCards.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="mt-3 text-sm text-slate-500">{s.label}</div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">{s.value}</div>
                <div className="text-xs text-emerald-600 font-medium mt-1">{s.change} vs last month</div>
              </div>
            ))}
          </div>

          {/* Table + sidebar */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="min-w-0 bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600">
                    <option>Bulk Actions</option>
                    <option>Activate</option>
                    <option>Deactivate</option>
                    <option>Delete</option>
                  </select>
                  <button className="text-sm font-medium text-blue-600 border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-50">
                    Apply
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button className="flex items-center gap-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg px-3.5 py-2 hover:bg-slate-50">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      placeholder="Search users..."
                      className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="px-4 py-3 font-medium w-8">
                        <input type="checkbox" className="rounded border-slate-300" />
                      </th>
                      <th className="px-2 py-3 font-medium">User</th>
                      <th className="px-2 py-3 font-medium">Role</th>
                      <th className="px-2 py-3 font-medium">Status</th>
                      <th className="px-2 py-3 font-medium">Email Verified</th>
                      <th className="px-2 py-3 font-medium">Joined Date</th>
                      <th className="px-2 py-3 font-medium">Last Active</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.email} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3.5">
                          <input type="checkbox" className="rounded border-slate-300" />
                        </td>
                        <td className="px-2 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0 flex items-center justify-center text-[11px] font-semibold text-slate-500">
                              {u.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-slate-800 truncate">{u.name}</div>
                              <div className="text-xs text-slate-400 truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3.5">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${roleStyle[u.role]}`}>{u.role}</span>
                        </td>
                        <td className="px-2 py-3.5">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${u.status === "Active" ? "text-emerald-600" : "text-red-500"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === "Active" ? "bg-emerald-500" : "bg-red-500"}`} />
                            {u.status}
                          </span>
                        </td>
                        <td className="px-2 py-3.5">
                          <span className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-white text-[10px] ${u.verified ? "bg-emerald-500" : "bg-red-500"}`}>
                            {u.verified ? "✓" : "✕"}
                          </span>
                        </td>
                        <td className="px-2 py-3.5 text-slate-500 whitespace-nowrap">{u.joined}</td>
                        <td className="px-2 py-3.5 text-slate-500 whitespace-nowrap">{u.active}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">Showing 1 to 10 of 2,846 users</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button className="p-1.5 rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      className={`w-8 h-8 rounded-md text-xs font-medium ${
                        p === 1 ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <span className="text-slate-400 text-xs px-1">...</span>
                  <button className="w-8 h-8 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    285
                  </button>
                  <button className="p-1.5 rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <select className="ml-1 text-xs border border-slate-200 rounded-md px-2 py-1.5 text-slate-600">
                    <option>10 / page</option>
                    <option>25 / page</option>
                    <option>50 / page</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h2 className="font-semibold text-slate-900 mb-4">User Summary</h2>
                <div className="flex items-center gap-4">
                  <div className="w-28 h-28 shrink-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" innerRadius={34} outerRadius={54} paddingAngle={2} stroke="none">
                          {pieData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-base font-bold text-slate-900">2,846</span>
                      <span className="text-[9px] text-slate-400">Total Users</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 text-xs">
                    {[
                      { label: "Job Seekers", value: "1,932 (67.9%)", color: "#10b981" },
                      { label: "Employers", value: "712 (25.0%)", color: "#2563eb" },
                      { label: "Article Authors", value: "156 (5.5%)", color: "#f59e0b" },
                      { label: "Administrators", value: "46 (1.6%)", color: "#ef4444" },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                          {r.label}
                        </span>
                        <span className="text-slate-500 font-medium">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-900">Filters</h2>
                  <button className="text-xs text-blue-600 font-medium">Clear All</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Role</label>
                    <select className="mt-1.5 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600">
                      <option>All Roles</option>
                      <option>Job Seeker</option>
                      <option>Employer</option>
                      <option>Article Author</option>
                      <option>Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Status</label>
                    <select className="mt-1.5 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600">
                      <option>All Status</option>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Email Verified</label>
                    <select className="mt-1.5 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600">
                      <option>All</option>
                      <option>Verified</option>
                      <option>Unverified</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Joined Date</label>
                    <button className="mt-1.5 w-full flex items-center justify-between text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-400">
                      Select date range
                      <Filter className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-2">
                    <Filter className="w-4 h-4" />
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
