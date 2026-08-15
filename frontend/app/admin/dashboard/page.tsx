"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  ClipboardCheck,
  Calendar,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const stats = [
  { label: "Total Users", value: "2,846", change: "+18.6%", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Companies", value: "1,253", change: "+14.2%", icon: Building2, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Active Jobs", value: "3,489", change: "+12.8%", icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Articles", value: "732", change: "+9.7%", icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
  { label: "Applications", value: "8,592", change: "+15.3%", icon: ClipboardCheck, color: "text-blue-600", bg: "bg-blue-50" },
];

const trendData = [
  { day: "May 12", Users: 950, Jobs: 350, Applications: 780 },
  { day: "May 13", Users: 1100, Jobs: 420, Applications: 950 },
  { day: "May 14", Users: 1000, Jobs: 500, Applications: 900 },
  { day: "May 15", Users: 1550, Jobs: 460, Applications: 1350 },
  { day: "May 16", Users: 1400, Jobs: 650, Applications: 1550 },
  { day: "May 17", Users: 1750, Jobs: 700, Applications: 1400 },
  { day: "May 18", Users: 1900, Jobs: 780, Applications: 1720 },
];

const registrations = [
  { name: "Sarah Johnson", email: "sarah.j@example.com", role: "Job Seeker", time: "2 minutes ago" },
  { name: "PetroEnergy Solutions", email: "hr@petroenergy.com", role: "Employer", time: "15 minutes ago" },
  { name: "Michael Brown", email: "michael.b@example.com", role: "Job Seeker", time: "1 hour ago" },
  { name: "Global Oil Services", email: "careers@gos.com", role: "Employer", time: "2 hours ago" },
  { name: "Emily Davis", email: "emily.d@example.com", role: "Job Seeker", time: "3 hours ago" },
];

const roleBadge: Record<string, string> = {
  "Job Seeker": "bg-emerald-50 text-emerald-600",
  Employer: "bg-blue-50 text-blue-600",
};

const systemStatus = [
  { label: "Website", status: "Online" },
  { label: "Database", status: "Healthy" },
  { label: "File Storage", status: "Healthy" },
  { label: "Email Service", status: "Healthy" },
  { label: "Queue", status: "Healthy" },
];

const jobCategories = [
  { label: "Engineering", value: 1245, pct: "35.7%", color: "#2563eb" },
  { label: "Drilling", value: 842, pct: "24.1%", color: "#7c3aed" },
  { label: "Operations", value: 658, pct: "18.9%", color: "#059669" },
  { label: "HSE / Safety", value: 401, pct: "11.5%", color: "#f59e0b" },
  { label: "R&D / Technical", value: 343, pct: "9.8%", color: "#e11d48" },
];

const topCountries = [
  { label: "United States", value: 1256, max: 1256 },
  { label: "UAE", value: 842, max: 1256 },
  { label: "Saudi Arabia", value: 523, max: 1256 },
  { label: "Canada", value: 312, max: 1256 },
  { label: "Qatar", value: 278, max: 1256 },
];

const recentActivities = [
  { text: "New user registered: PetroEnergy Solutions", time: "15 minutes ago" },
  { text: "Job published: Senior Drilling Engineer", time: "1 hour ago" },
  { text: "Article published: Future of Hydrogen Energy", time: "2 hours ago" },
  { text: "Company approved: Global Oil Services", time: "3 hours ago" },
  { text: "Database backup completed successfully", time: "5 hours ago" },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar active="dashboard" />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar variant="dark" />

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Welcome back, Super Admin! 👋</h1>
              <p className="text-sm text-slate-500 mt-1">Here&apos;s what&apos;s happening on Energy Tail today.</p>
            </div>
            <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Calendar className="w-4 h-4 text-slate-400" />
              May 12 – May 18, 2025
              <ChevronRight className="w-3.5 h-3.5 rotate-90 text-slate-400" />
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-500">{s.label}</div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">{s.value}</div>
                <div className="text-xs text-emerald-600 font-medium mt-1">{s.change} vs last week</div>
              </div>
            ))}
          </div>

          {/* Chart + panels row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Overview Analytics</h2>
                <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="flex items-center gap-5 text-xs text-slate-500 mb-2">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Users</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Jobs</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> Applications</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Users" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Applications" stroke="#fb923c" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Jobs" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Recent Registrations</h2>
                <a href="/admin/users" className="text-xs text-blue-600 font-medium">View All</a>
              </div>
              <div className="space-y-4">
                {registrations.map((r) => (
                  <div key={r.email} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0 flex items-center justify-center text-xs font-semibold text-slate-500">
                      {r.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{r.name}</div>
                      <div className="text-xs text-slate-400 truncate">{r.email}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${roleBadge[r.role]}`}>{r.role}</span>
                      <div className="text-[11px] text-slate-400 mt-1">{r.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Top Job Categories</h2>
                <a href="/admin/job-categories" className="text-xs text-blue-600 font-medium">View All</a>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={jobCategories}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={26}
                        outerRadius={44}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {jobCategories.map((c) => (
                          <Cell key={c.label} fill={c.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-bold text-slate-900">3,489</span>
                    <span className="text-[10px] text-slate-400">Total Jobs</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {jobCategories.map((c) => (
                    <div key={c.label} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-600 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="truncate">{c.label}</span>
                      </span>
                      <span className="text-slate-500 font-medium shrink-0 whitespace-nowrap">
                        {c.value.toLocaleString()} <span className="text-slate-400">({c.pct})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Top Countries (Jobs)</h2>
                <a href="/admin/countries" className="text-xs text-blue-600 font-medium">View All</a>
              </div>
              <div className="space-y-3.5">
                {topCountries.map((c) => (
                  <div key={c.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">{c.label}</span>
                      <span className="text-slate-500 font-medium">{c.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${(c.value / c.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Recent System Activities</h2>
                <a href="/admin/audit-logs" className="text-xs text-blue-600 font-medium">View All</a>
              </div>
              <div className="space-y-4">
                {recentActivities.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <div className="text-sm text-slate-700 leading-snug">{a.text}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System status */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">System Status</h2>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Last checked: 1 min ago
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {systemStatus.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-600">{s.label}</span>
                  <span className="ml-auto text-xs text-emerald-600 font-medium">{s.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-2">© 2025 Energy Tail. All rights reserved.</div>
        </main>
      </div>
    </div>
  );
}
