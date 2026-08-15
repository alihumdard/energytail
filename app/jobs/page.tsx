import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { DarkFooter } from "@/components/Shared";
import {
  Search,
  MapPin,
  Bookmark,
  Bell,
  ChevronDown,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Mail,
} from "lucide-react";

const locations = [
  { label: "United Arab Emirates", count: "1,245" },
  { label: "Saudi Arabia", count: "980" },
  { label: "Qatar", count: "756" },
  { label: "United States", count: "532" },
  { label: "India", count: "421" },
];

const jobCategories = [
  { label: "Oil & Gas", count: "2,340" },
  { label: "Engineering", count: "2,789" },
  { label: "HSE", count: "1,224" },
  { label: "Drilling", count: "892" },
  { label: "LNG", count: "1,567" },
];

const jobTypes = [
  { label: "Full Time", count: "8,122" },
  { label: "Contract", count: "1,324" },
  { label: "Temporary", count: "456" },
  { label: "Part Time", count: "231" },
  { label: "Internship", count: "182" },
];

const experience = [
  { label: "Entry Level", count: "1,245" },
  { label: "Mid Level", count: "4,567" },
  { label: "Senior Level", count: "3,211" },
];

const jobs = [
  {
    title: "Senior Process Engineer",
    company: "Saudi Aramco",
    logo: "AR",
    logoBg: "bg-emerald-50 text-emerald-700",
    location: "Dhahran, Saudi Arabia",
    salary: "AED 18,000 - 28,000",
    time: "2h ago",
    badge: "New",
    featured: true,
    verified: true,
    tags: ["Engineering", "Process", "Petrochemical"],
  },
  {
    title: "HSE Advisor",
    company: "TotalEnergies",
    logo: "TE",
    logoBg: "bg-red-50 text-red-600",
    location: "Qatar",
    salary: "AED 12,000 - 18,000",
    time: "5h ago",
    badge: "New",
    verified: true,
    tags: ["HSE", "Safety", "Risk Management"],
  },
  {
    title: "Drilling Supervisor",
    company: "BP",
    logo: "bp",
    logoBg: "bg-green-50 text-green-700",
    location: "Abu Dhabi, UAE",
    salary: "AED 15,000 - 25,000",
    time: "1d ago",
    verified: true,
    tags: ["Drilling", "Supervision", "Offshore"],
  },
  {
    title: "Reservoir Engineer",
    company: "SLB",
    logo: "S",
    logoBg: "bg-blue-50 text-blue-700",
    location: "Houston, United States",
    salary: "USD 9,000 - 14,000",
    time: "1d ago",
    tags: ["Reservoir", "Engineering", "Petroleum"],
  },
  {
    title: "Project Manager",
    company: "ExxonMobil",
    logo: "X",
    logoBg: "bg-red-50 text-red-700",
    location: "Houston, United States",
    salary: "USD 10,000 - 16,000",
    time: "2d ago",
    tags: ["Management", "Project", "Planning"],
  },
  {
    title: "Mechanical Engineer",
    company: "Chevron",
    logo: "C",
    logoBg: "bg-sky-50 text-sky-700",
    location: "Calgary, Canada",
    salary: "CAD 7,000 - 11,000",
    time: "2d ago",
    tags: ["Mechanical", "Engineering", "Design"],
  },
];

export default function JobsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader active="Jobs" />

      {/* Page hero */}
      <section className="relative bg-[#0B2B26] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B2B26] via-[#0B2B26]/85 to-[#0B2B26]/50 z-10" />
          <div className="w-full h-full bg-[linear-gradient(to_bottom,#123832,#081C18)]" />
        </div>
        <div className="relative z-20 mx-auto max-w-7xl px-6 pt-8 pb-24">
          <p className="text-xs text-slate-400 mb-4">
            Home <span className="mx-1">/</span> Jobs
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold">Browse Jobs</h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base">
            Explore thousands of oil, gas &amp; energy jobs from leading employers worldwide.
          </p>
        </div>
      </section>

      {/* Search bar (overlapping) */}
      <div className="mx-auto max-w-7xl px-6 w-full -mt-14 relative z-30">
        <div className="bg-white rounded-2xl shadow-xl p-4 flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input
              placeholder="Job title, keywords or company"
              className="w-full text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 md:w-44">
            <span className="text-sm text-slate-500">All Countries</span>
            <ChevronDown size={14} className="text-slate-400 ml-auto" />
          </div>
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 md:w-44">
            <span className="text-sm text-slate-500">All Categories</span>
            <ChevronDown size={14} className="text-slate-400 ml-auto" />
          </div>
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 md:w-40">
            <span className="text-sm text-slate-500">All Job Types</span>
            <ChevronDown size={14} className="text-slate-400 ml-auto" />
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-semibold rounded-lg px-6 py-2.5 flex items-center justify-center gap-2">
            <Search size={15} /> Search Jobs
          </button>
        </div>
      </div>

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-6 py-10 w-full grid lg:grid-cols-[280px_1fr] gap-8">
        {/* Filters sidebar */}
        <aside className="space-y-6">
          <div className="border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Filter Jobs</h3>
              <button className="text-xs font-semibold text-blue-600">Reset All</button>
            </div>

            <div className="mb-5">
              <label className="text-sm font-medium text-slate-700 block mb-2">Keywords</label>
              <input
                placeholder="Job title, skills or company"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
              />
            </div>

            <div className="mb-5">
              <label className="text-sm font-medium text-slate-700 block mb-2">Locations</label>
              <input
                placeholder="Search country or city"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 mb-3"
              />
              <div className="space-y-2.5">
                {locations.map((l) => (
                  <label key={l.label} className="flex items-center justify-between text-sm text-slate-600 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
                      {l.label}
                    </span>
                    <span className="text-xs text-slate-400">{l.count}</span>
                  </label>
                ))}
              </div>
              <button className="text-xs font-semibold text-blue-600 mt-3">+ Show more</button>
            </div>

            <div className="mb-5 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">Job Category</label>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
              <div className="space-y-2.5">
                {jobCategories.map((l) => (
                  <label key={l.label} className="flex items-center justify-between text-sm text-slate-600 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
                      {l.label}
                    </span>
                    <span className="text-xs text-slate-400">{l.count}</span>
                  </label>
                ))}
              </div>
              <button className="text-xs font-semibold text-blue-600 mt-3">+ Show more</button>
            </div>

            <div className="mb-5 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">Job Type</label>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
              <div className="space-y-2.5">
                {jobTypes.map((l) => (
                  <label key={l.label} className="flex items-center justify-between text-sm text-slate-600 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
                      {l.label}
                    </span>
                    <span className="text-xs text-slate-400">{l.count}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">Experience Level</label>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
              <div className="space-y-2.5">
                {experience.map((l) => (
                  <label key={l.label} className="flex items-center justify-between text-sm text-slate-600 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
                      {l.label}
                    </span>
                    <span className="text-xs text-slate-400">{l.count}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <label className="text-sm font-medium text-slate-700 block mb-3">Salary Range</label>
              <input type="range" className="w-full accent-blue-600" />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>AED 3,000</span>
                <span>AED 50,000+</span>
              </div>
            </div>

            <button className="w-full mt-6 border border-slate-300 text-slate-700 font-semibold text-sm rounded-lg py-2.5 hover:border-blue-400 hover:text-blue-600">
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Job list */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-900">8,756</span> Jobs Found
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                Sort by:
                <span className="flex items-center gap-1 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700">
                  Newest First <ChevronDown size={14} />
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1 border border-slate-200 rounded-lg p-1">
                <span className="w-7 h-7 grid place-items-center rounded-md bg-blue-600 text-white">
                  <List size={14} />
                </span>
                <span className="w-7 h-7 grid place-items-center rounded-md text-slate-400">
                  <LayoutGrid size={14} />
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-blue-600 text-white grid place-items-center shrink-0">
                <Bell size={15} />
              </span>
              <p className="text-sm text-slate-700">
                Create a job alert and get notified when new jobs match your criteria.
                <span className="block text-xs text-slate-400">
                  Save your search and get the best opportunities straight to your inbox.
                </span>
              </p>
            </div>
            <button className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-100 shrink-0">
              Create Job Alert
            </button>
          </div>

          <div className="space-y-4">
            {jobs.map((j) => (
              <div
                key={j.title}
                className={`relative bg-white border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-all ${
                  j.featured ? "border-blue-300" : "border-slate-200"
                }`}
              >
                {j.featured && (
                  <span className="absolute -top-2.5 left-5 text-[10px] font-bold tracking-wide text-white bg-emerald-500 px-2.5 py-1 rounded">
                    FEATURED
                  </span>
                )}
                <div
                  className={`w-12 h-12 rounded-lg grid place-items-center font-bold text-sm shrink-0 ${j.logoBg}`}
                >
                  {j.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link href="/jobs" className="font-semibold text-slate-900 hover:text-blue-600">
                      {j.title}
                    </Link>
                    {j.verified && <BadgeCheck size={15} className="text-blue-500" />}
                    {j.badge && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {j.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-600 font-medium">{j.company}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} /> {j.location}
                    </span>
                    <span>Full Time</span>
                    <span className="font-semibold text-slate-600">{j.salary}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {j.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                  <span className="text-xs text-slate-400">{j.time}</span>
                  <div className="flex items-center gap-2">
                    <button className="w-9 h-9 grid place-items-center border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-300">
                      <Bookmark size={15} />
                    </button>
                    <Link
                      href="/employer-dashboard"
                      className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 grid place-items-center border border-slate-200 rounded-lg text-slate-400">
                <ChevronLeft size={14} />
              </button>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`w-8 h-8 grid place-items-center rounded-lg text-sm font-medium ${
                    n === 1
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 text-slate-600 hover:border-blue-300"
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="text-slate-400 px-1">…</span>
              <button className="w-8 h-8 grid place-items-center border border-slate-200 rounded-lg text-sm font-medium text-slate-600">
                146
              </button>
              <button className="w-8 h-8 grid place-items-center border border-slate-200 rounded-lg text-slate-400">
                <ChevronRight size={14} />
              </button>
            </div>
            <p className="text-xs text-slate-400">Showing 1 to 20 of 8,756 jobs</p>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-7xl px-6 pb-14 w-full">
        <div className="bg-blue-50 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-4">
            <span className="w-11 h-11 rounded-full bg-blue-600 text-white grid place-items-center shrink-0">
              <Mail size={18} />
            </span>
            <div>
              <h3 className="font-bold text-slate-900">Don&apos;t miss your dream job</h3>
              <p className="text-sm text-slate-500">
                Subscribe to job alerts and get the best opportunities delivered to your inbox.
              </p>
            </div>
          </div>
          <div className="flex w-full md:w-auto gap-2 shrink-0">
            <input
              placeholder="Enter your email address"
              className="min-w-0 flex-1 md:w-64 px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-400"
            />
            <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <DarkFooter />
    </div>
  );
}