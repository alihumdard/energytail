"use client";

import { useState } from "react";
import {
  Menu,
  Search,
  MessageSquare,
  Bell,
  ChevronDown,
  LayoutDashboard,
  FileSearch,
  FileText,
  Bookmark,
  BellRing,
  User as UserIcon,
  FileEdit,
  Star,
  Settings,
  LogOut,
  Briefcase,
  Eye,
  MoreVertical,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ClipboardCheck,
  DollarSign,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data — replace with real data from your API
// ---------------------------------------------------------------------------

interface Application {
  id: number;
  role: string;
  company: string;
  logo: string;
  status: "In Review" | "Shortlisted" | "Applied" | "Rejected";
  date: string;
}

const applications: Application[] = [
  {
    id: 1,
    role: "Senior Drilling Engineer",
    company: "Shell International",
    logo: "https://logo.clearbit.com/shell.com",
    status: "In Review",
    date: "May 18, 2024",
  },
  {
    id: 2,
    role: "Reservoir Engineer",
    company: "BP",
    logo: "https://logo.clearbit.com/bp.com",
    status: "Shortlisted",
    date: "May 15, 2024",
  },
  {
    id: 3,
    role: "Process Engineer",
    company: "TotalEnergies",
    logo: "https://logo.clearbit.com/totalenergies.com",
    status: "In Review",
    date: "May 12, 2024",
  },
  {
    id: 4,
    role: "Field Operations Engineer",
    company: "ExxonMobil",
    logo: "https://logo.clearbit.com/exxonmobil.com",
    status: "Applied",
    date: "May 10, 2024",
  },
  {
    id: 5,
    role: "Wellsite Geologist",
    company: "Schlumberger",
    logo: "https://logo.clearbit.com/slb.com",
    status: "Rejected",
    date: "May 5, 2024",
  },
];

const statusStyles: Record<Application["status"], string> = {
  "In Review": "bg-blue-100 text-blue-700",
  Shortlisted: "bg-emerald-100 text-emerald-700",
  Applied: "bg-slate-100 text-slate-600",
  Rejected: "bg-red-100 text-red-700",
};

interface RecommendedJob {
  id: number;
  role: string;
  company: string;
  logo: string;
  logoBg: string;
  location: string;
  type: string;
  posted: string;
}

const recommendedJobs: RecommendedJob[] = [
  {
    id: 1,
    role: "Drilling Engineer",
    company: "Chevron",
    logo: "https://logo.clearbit.com/chevron.com",
    logoBg: "bg-red-50",
    location: "Abu Dhabi, UAE",
    type: "Full Time",
    posted: "Posted 2 days ago",
  },
  {
    id: 2,
    role: "Production Engineer",
    company: "ADNOC",
    logo: "https://logo.clearbit.com/adnoc.ae",
    logoBg: "bg-blue-50",
    location: "Abu Dhabi, UAE",
    type: "Full Time",
    posted: "Posted 1 day ago",
  },
  {
    id: 3,
    role: "HSE Engineer",
    company: "Eni",
    logo: "https://logo.clearbit.com/eni.com",
    logoBg: "bg-amber-50",
    location: "Doha, Qatar",
    type: "Full Time",
    posted: "Posted 3 days ago",
  },
];

const jobAlerts = [
  { role: "Drilling Engineer in UAE", meta: "25 new jobs", time: "10m ago" },
  { role: "Reservoir Engineer", meta: "18 new jobs", time: "1h ago" },
  { role: "HSE Engineer in Qatar", meta: "12 new jobs", time: "2h ago" },
];

const careerResources = [
  {
    icon: FileEdit,
    title: "Resume Writing Tips",
    sub: "Build a professional resume",
  },
  {
    icon: UserIcon,
    title: "Interview Preparation",
    sub: "Get ready for your next interview",
  },
  {
    icon: DollarSign,
    title: "Salary Guide",
    sub: "Check industry salary trends",
  },
];

const sidebarNav = [
  { section: "JOB SEARCH", items: [
    { label: "Browse Jobs", icon: FileSearch, href: "/jobs" },
    { label: "Applications", icon: FileText, badge: 8, href: "/jobs" },
    { label: "Saved Jobs", icon: Bookmark, badge: 12, href: "/jobs" },
    { label: "Job Alerts", icon: BellRing, href: "/jobs" },
  ]},
  { section: "MY PROFILE", items: [
    { label: "Profile", icon: UserIcon, href: "/dashboard" },
    { label: "Resume / CV", icon: FileText, href: "/dashboard" },
    { label: "Cover Letters", icon: FileEdit, href: "/dashboard" },
    { label: "Skills", icon: Star, href: "/dashboard" },
  ]},
  { section: "ACCOUNT", items: [
    { label: "Settings", icon: Settings, href: "/dashboard" },
    { label: "Logout", icon: LogOut, href: "/login" },
  ]},
];

function DashboardSidebar({ profileCompletion }: { profileCompletion: number }) {
  return (
    <>
      <div className="flex items-center gap-2 px-6 py-6">
        <img src="/logo.png" alt="Energy Tail" className="h-10 w-auto object-contain" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        <ul className="space-y-1">
          <li>
            <a
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-600"
            >
              <LayoutDashboard className="h-[18px] w-[18px]" />
              Dashboard
            </a>
          </li>
        </ul>

        {sidebarNav.map((group) => (
          <div key={group.section}>
            <p className="px-3 pb-2 pt-6 text-xs font-semibold tracking-wider text-slate-400">
              {group.section}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-[18px] w-[18px]" />
                      {item.label}
                    </span>
                    {"badge" in item && item.badge ? (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-500">
                        {item.badge}
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="mb-1 text-sm font-semibold text-blue-700">
            Looking for the right job?
          </p>
          <p className="mb-3 text-xs text-blue-500">
            Complete your profile and get better job matches.
          </p>
          <div className="mb-3 flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0">
              <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#dbeafe"
                  strokeWidth="4"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 16 * (1 - profileCompletion / 100)
                  }`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-700">
                {profileCompletion}%
              </span>
            </div>
          </div>
          <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Complete Profile
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export default function JobSeekerDashboardPage() {
  const [profileCompletion] = useState(75);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        {/* ------------------------------------------------------------- */}
        {/* Sidebar                                                       */}
        {/* ------------------------------------------------------------- */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <DashboardSidebar profileCompletion={profileCompletion} />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
            />
            <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl">
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute right-3 top-5 z-10 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <DashboardSidebar profileCompletion={profileCompletion} />
            </aside>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Main column                                                   */}
        {/* ------------------------------------------------------------- */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Top bar */}
          <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex flex-1 max-w-2xl overflow-hidden rounded-lg border border-slate-200">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, skills..."
                  className="w-full py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none sm:pl-10"
                />
              </div>
              <button className="hidden items-center gap-1 border-l border-slate-200 px-3 text-sm text-slate-500 sm:flex">
                Jobs
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button className="flex items-center justify-center bg-blue-600 px-4 text-white hover:bg-blue-700">
                <Search className="h-4 w-4" />
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2 lg:gap-4">
              <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <MessageSquare className="h-5 w-5" />
              </button>
              <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                  3
                </span>
              </button>
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <img
                  src="https://i.pravatar.cc/40?img=53"
                  alt="John Doe"
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div className="hidden leading-tight sm:block">
                  <p className="text-sm font-semibold text-slate-800">
                    John Doe
                  </p>
                  <p className="text-xs text-slate-400">Job Seeker</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 lg:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome back, John! 👋
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Manage your job search, applications and profile all in one
                place.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
              {/* Left column */}
              <div>
                {/* Stat cards */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard
                    icon={Briefcase}
                    iconBg="bg-blue-50 text-blue-500"
                    label="Applications"
                    value="8"
                    sub="2 in review"
                  />
                  <StatCard
                    icon={Bookmark}
                    iconBg="bg-emerald-50 text-emerald-500"
                    label="Saved Jobs"
                    value="12"
                    sub="Jobs saved"
                  />
                  <StatCard
                    icon={Eye}
                    iconBg="bg-violet-50 text-violet-500"
                    label="Profile Views"
                    value="45"
                    sub="This week"
                  />
                  <StatCard
                    icon={BellRing}
                    iconBg="bg-amber-50 text-amber-500"
                    label="Job Alerts"
                    value="5"
                    sub="Active alerts"
                  />
                </div>

                {/* Recent applications */}
                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-800">
                      Recent Job Applications
                    </h2>
                    <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                      View All
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {applications.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
                      >
                        <img
                          src={app.logo}
                          alt={app.company}
                          className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 object-contain p-1.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {app.role}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {app.company}
                          </p>
                        </div>
                        <span
                          className={`hidden shrink-0 rounded-md px-2.5 py-1 text-xs font-medium sm:inline-block ${statusStyles[app.status]}`}
                        >
                          {app.status}
                        </span>
                        <span className="hidden w-24 shrink-0 text-right text-xs text-slate-400 md:inline-block">
                          {app.date}
                        </span>
                        <button className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended jobs */}
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-800">
                      Recommended Jobs for You
                    </h2>
                    <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                      View All Jobs
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {recommendedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-xl border border-slate-200 p-4 hover:shadow-sm"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <img
                            src={job.logo}
                            alt={job.company}
                            className={`h-10 w-10 rounded-lg object-contain p-1.5 ${job.logoBg}`}
                          />
                          <button className="text-slate-300 hover:text-blue-500">
                            <Bookmark className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">
                          {job.role}
                        </p>
                        <p className="mb-3 text-xs text-slate-400">
                          {job.company}
                        </p>
                        <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {job.location}
                        </div>
                        <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
                          <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />
                          {job.type}
                        </div>
                        <p className="text-xs text-slate-400">{job.posted}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <button className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6].map((dot) => (
                        <span
                          key={dot}
                          className={`h-1.5 w-1.5 rounded-full ${
                            dot === 0 ? "bg-blue-600" : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <button className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <aside className="space-y-6">
                {/* Profile completion */}
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="mb-4 text-base font-semibold text-slate-800">
                    Profile Completion
                  </h2>
                  <div className="mb-4 flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0">
                      <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                        <circle
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="3"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="3"
                          strokeDasharray={`${2 * Math.PI * 15.5}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 15.5 * (1 - profileCompletion / 100)
                          }`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-blue-700">
                        {profileCompletion}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Your profile is {profileCompletion}% complete. A
                      complete profile increases your chances of getting
                      hired.
                    </p>
                  </div>
                  <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    Complete Profile
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Job alerts */}
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-800">
                      Recent Job Alerts
                    </h2>
                    <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      View All
                    </button>
                  </div>
                  <ul className="space-y-4">
                    {jobAlerts.map((alert) => (
                      <li key={alert.role} className="flex gap-3">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-slate-800">
                              {alert.role}
                            </p>
                            <span className="shrink-0 text-xs text-slate-400">
                              {alert.time}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-blue-600">
                            {alert.meta}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button className="mt-4 flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600">
                    <Settings className="h-4 w-4" />
                    Manage Job Alerts
                  </button>
                </div>

                {/* Career resources */}
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="mb-4 text-base font-semibold text-slate-800">
                    Career Resources
                  </h2>
                  <ul className="divide-y divide-slate-100">
                    {careerResources.map((res) => (
                      <li key={res.title} className="flex items-center gap-3 py-3 first:pt-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                          <res.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {res.title}
                          </p>
                          <p className="text-xs text-slate-400">{res.sub}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button className="mt-2 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
                    View All Resources
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}
