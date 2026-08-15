"use client";

import Link from "next/link";
import DashboardShell, { NavSection } from "@/components/DashboardShell";
import {
  Home,
  PlusCircle,
  Briefcase,
  FileText,
  Users,
  Bookmark,
  Building2,
  UsersRound,
  CreditCard,
  Plus,
  TrendingUp,
  Eye,
  Star,
  MapPin,
  MoreVertical,
  UserPlus,
  StarIcon,
  PauseCircle,
  ArrowRight,
} from "lucide-react";

const sections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", icon: Home, href: "/employer-dashboard", active: true },
      { label: "Post a Job", icon: PlusCircle, href: "#" },
      { label: "Jobs Management", icon: Briefcase, href: "#" },
      { label: "Applications", icon: FileText, href: "#" },
      { label: "Candidates", icon: Users, href: "#" },
      { label: "Saved Candidates", icon: Bookmark, href: "#" },
    ],
  },
  {
    title: "COMPANY",
    items: [
      { label: "Company Profile", icon: Building2, href: "/employer/company-profile" },
      { label: "Team Members", icon: UsersRound, href: "#" },
      { label: "Subscription & Billing", icon: CreditCard, href: "#" },
    ],
  },
];

const stats = [
  { label: "Active Jobs", value: "12", icon: Briefcase, iconBg: "bg-blue-50 text-blue-600", trend: "3 new this week" },
  { label: "Total Applications", value: "248", icon: Users, iconBg: "bg-emerald-50 text-emerald-600", trend: "+18 this week" },
  { label: "Candidates Shortlisted", value: "36", icon: Star, iconBg: "bg-violet-50 text-violet-600", trend: "+6 this week" },
  { label: "Profile Views", value: "1,245", icon: Eye, iconBg: "bg-orange-50 text-orange-600", trend: "+124 this week" },
];

const applicationsStatus = [
  { label: "New", value: 112, pct: 45, color: "bg-blue-600" },
  { label: "Shortlisted", value: 36, pct: 15, color: "bg-violet-500" },
  { label: "In Review", value: 58, pct: 23, color: "bg-emerald-500" },
  { label: "Interview", value: 28, pct: 11, color: "bg-amber-400" },
  { label: "Rejected", value: 14, pct: 6, color: "bg-rose-500" },
];

const activeJobs = [
  { title: "Drilling Engineer", location: "Abu Dhabi, UAE", applications: 48, views: 320, status: "Active", posted: "May 12, 2025" },
  { title: "Reservoir Engineer", location: "Houston, USA", applications: 36, views: 280, status: "Active", posted: "May 10, 2025" },
  { title: "HSE Officer", location: "Doha, Qatar", applications: 28, views: 210, status: "Active", posted: "May 8, 2025" },
  { title: "Pipeline Supervisor", location: "Calgary, Canada", applications: 22, views: 185, status: "Active", posted: "May 5, 2025" },
  { title: "Field Operations Manager", location: "Muscat, Oman", applications: 18, views: 150, status: "Paused", posted: "May 2, 2025" },
];

const quickActions = [
  { icon: PlusCircle, title: "Post a New Job", body: "Reach the right candidates", href: "/admin/job-details" },
  { icon: Briefcase, title: "Manage Jobs", body: "Edit, pause or close jobs", href: "/admin/jobs" },
  { icon: Users, title: "Browse Candidates", body: "Search and view candidates", href: "/jobs" },
  { icon: CreditCard, title: "Subscription & Billing", body: "Manage your plan and payments", href: "/admin/settings" },
];

const activity = [
  { icon: UserPlus, iconBg: "bg-emerald-50 text-emerald-600", title: "New application received", sub: "Drilling Engineer", time: "2 minutes ago" },
  { icon: Eye, iconBg: "bg-orange-50 text-orange-600", title: "Your job was viewed", sub: "Pipeline Supervisor", time: "1 hour ago" },
  { icon: StarIcon, iconBg: "bg-blue-50 text-blue-600", title: "Candidate shortlisted", sub: "Reservoir Engineer", time: "2 hours ago" },
  { icon: UserPlus, iconBg: "bg-violet-50 text-violet-600", title: "New application received", sub: "HSE Officer", time: "3 hours ago" },
  { icon: PauseCircle, iconBg: "bg-rose-50 text-rose-600", title: "Job paused", sub: "Field Operations Manager", time: "Yesterday" },
];

export default function EmployerDashboardPage() {
  const maxVal = 80;
  const points = [30, 40, 45, 60, 45, 68, 65];
  const days = ["May 9", "May 10", "May 11", "May 12", "May 13", "May 14", "May 15"];
  const w = 100 / (points.length - 1);

  const pathPoints = points
    .map((p, i) => `${i * w},${100 - (p / maxVal) * 100}`)
    .join(" ");

  return (
    <DashboardShell
      sections={sections}
      searchPlaceholder="Search jobs, candidates, companies..."
      searchTypeLabel="Jobs"
      userName="PetroEnergy Solutions"
      userRole="Employer"
      userAvatarInitials="PE"
      notifCount={8}
      msgCount={3}
      planTitle="Upgrade Your Plan"
      planBody="Get more visibility and better candidates by upgrading your subscription."
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Welcome back, PetroEnergy Solutions! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">Here&apos;s what&apos;s happening with your company today.</p>
        </div>
        <Link
          href="/admin/job-details"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shrink-0"
        >
          <Plus size={16} /> Post a New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
              </div>
              <span className={`w-11 h-11 rounded-lg grid place-items-center ${s.iconBg}`}>
                <s.icon size={20} />
              </span>
            </div>
            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <TrendingUp size={12} /> {s.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-6 min-w-0">
          {/* Applications Overview + status */}
          <div className="grid md:grid-cols-[1fr_320px] gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-900">Applications Overview</h3>
                <span className="text-xs font-medium text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5">
                  Last 7 Days
                </span>
              </div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-40">
                <polyline
                  points={pathPoints}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                <polygon
                  points={`0,100 ${pathPoints} 100,100`}
                  fill="url(#grad)"
                  opacity="0.15"
                />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                {days.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Applications by Status</h3>
              <div className="relative w-40 h-40 mx-auto mb-4">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {(() => {
                    let offset = 0;
                    return applicationsStatus.map((s) => {
                      const dash = s.pct;
                      const circle = (
                        <circle
                          key={s.label}
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke={
                            s.color === "bg-blue-600"
                              ? "#2563eb"
                              : s.color === "bg-violet-500"
                              ? "#8b5cf6"
                              : s.color === "bg-emerald-500"
                              ? "#10b981"
                              : s.color === "bg-amber-400"
                              ? "#fbbf24"
                              : "#f43f5e"
                          }
                          strokeWidth="4"
                          strokeDasharray={`${dash} ${100 - dash}`}
                          strokeDashoffset={-offset}
                        />
                      );
                      offset += dash;
                      return circle;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-900">248</p>
                    <p className="text-[11px] text-slate-400">Total</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {applicationsStatus.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className={`w-2 h-2 rounded-full ${s.color}`} />
                      {s.label}
                    </span>
                    <span className="text-slate-400">
                      {s.value} ({s.pct}%)
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/admin/jobs"
                className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-blue-600"
              >
                View all applications <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Active jobs table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Your Active Jobs</h3>
              <Link href="/admin/jobs" className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                View All Jobs <ArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="pb-3 font-medium">Job Title</th>
                    <th className="pb-3 font-medium">Applications</th>
                    <th className="pb-3 font-medium">Views</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Posted On</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeJobs.map((j) => (
                    <tr key={j.title} className="border-b border-slate-50 last:border-0">
                      <td className="py-3.5">
                        <p className="font-medium text-slate-800">{j.title}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {j.location}
                        </p>
                      </td>
                      <td className="py-3.5 text-slate-600">{j.applications}</td>
                      <td className="py-3.5 text-slate-600">{j.views}</td>
                      <td className="py-3.5">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            j.status === "Active"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {j.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">{j.posted}</td>
                      <td className="py-3.5 text-right">
                        <button className="text-slate-400 hover:text-slate-600">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6 min-w-0">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-1">
              {quickActions.map((a) => (
                <Link
                  key={a.title}
                  href={a.href}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 grid place-items-center shrink-0">
                    <a.icon size={18} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-800">{a.title}</span>
                    <span className="block text-xs text-slate-400">{a.body}</span>
                  </span>
                  <ArrowRight size={14} className="text-slate-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Recent Activity</h3>
              <Link href="/admin/audit-logs" className="text-xs font-semibold text-blue-600">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${a.iconBg}`}>
                    <a.icon size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.sub}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 grid place-items-center">
                💎
              </span>
              <h3 className="font-semibold text-slate-900">Your Plan</h3>
            </div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-slate-900">Premium Plan</p>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Expires on: June 15, 2025</p>
            <Link href="/admin/settings" className="text-xs font-semibold text-blue-600 flex items-center gap-1">
              Manage Subscription <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}