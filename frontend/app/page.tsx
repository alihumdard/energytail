import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { DarkFooter } from "@/components/Shared";
import {
  Search,
  MapPin,
  Building2,
  Fuel,
  Wind,
  Flame as FlameIcon,
  Factory,
  Cog,
  HardHat,
  ShieldCheck,
  Anchor,
  Briefcase,
  Users,
  Globe2,
  TrendingUp,
  Mail,
  Bookmark,
} from "lucide-react";

const categories = [
  { icon: Fuel, label: "Oil & Gas", count: "2,340 Jobs" },
  { icon: Wind, label: "Renewable Energy", count: "1,245 Jobs" },
  { icon: FlameIcon, label: "LNG", count: "892 Jobs" },
  { icon: Factory, label: "Petrochemical", count: "1,567 Jobs" },
  { icon: Cog, label: "Power Generation", count: "1,102 Jobs" },
  { icon: HardHat, label: "Engineering", count: "2,789 Jobs" },
  { icon: ShieldCheck, label: "HSE", count: "1,234 Jobs" },
  { icon: Anchor, label: "Offshore & Marine", count: "978 Jobs" },
];

const jobs = [
  {
    title: "Senior Drilling Engineer",
    company: "Saudi Aramco",
    logo: "AR",
    logoBg: "bg-emerald-50 text-emerald-700",
    location: "Dhahran, Saudi Arabia",
    time: "2h ago",
    tags: ["Full Time", "Engineering", "Drilling"],
  },
  {
    title: "Process Safety Engineer",
    company: "TotalEnergies",
    logo: "TE",
    logoBg: "bg-red-50 text-red-600",
    location: "Qatar",
    time: "5h ago",
    tags: ["Full Time", "HSE", "Safety"],
  },
  {
    title: "Pipeline Integrity Engineer",
    company: "BP",
    logo: "bp",
    logoBg: "bg-green-50 text-green-700",
    location: "London, UK (Hybrid)",
    time: "1d ago",
    tags: ["Full Time", "Engineering", "Pipeline"],
  },
  {
    title: "Offshore Construction Manager",
    company: "Subsea 7",
    logo: "S7",
    logoBg: "bg-slate-100 text-slate-700",
    location: "Abu Dhabi, UAE",
    time: "2d ago",
    tags: ["Full Time", "Offshore", "Construction"],
  },
];

const employers = ["Aramco", "TotalEnergies", "BP", "ExxonMobil", "Chevron", "Shell", "PETRONAS", "ADNOC"];

const stats = [
  { icon: Briefcase, value: "10,000+", label: "Active Jobs" },
  { icon: Building2, value: "2,500+", label: "Companies" },
  { icon: Users, value: "150,000+", label: "Job Seekers" },
  { icon: Globe2, value: "120+", label: "Countries" },
  { icon: TrendingUp, value: "5M+", label: "Job Views/Month" },
];

const articles = [
  {
    tag: "INDUSTRY NEWS",
    title: "Global Energy Jobs Outlook 2024: Key Trends & Insights",
    date: "May 10, 2024",
    read: "5 min read",
    grad: "from-slate-800 to-slate-600",
  },
  {
    tag: "CAREER TIPS",
    title: "Top Skills in Demand for Oil & Gas Professionals in 2024",
    date: "May 8, 2024",
    read: "4 min read",
    grad: "from-orange-700 to-amber-500",
  },
  {
    tag: "RENEWABLES",
    title: "The Future of Renewable Energy Jobs and Opportunities",
    date: "May 5, 2024",
    read: "6 min read",
    grad: "from-sky-700 to-blue-400",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader active="" />

      {/* Hero */}
      <section className="relative bg-[#0B2B26] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B2B26] via-[#0B2B26]/85 to-[#0B2B26]/40 z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(62,189,62,0.35),transparent_55%)] z-10" />
          <div className="w-full h-full bg-[linear-gradient(to_bottom,#123832,#081C18)]" />
        </div>
        <div className="relative z-20 mx-auto max-w-7xl px-6 pt-16 pb-28 md:pt-20 md:pb-36">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Find Your Next Opportunity in{" "}
              <span className="text-blue-400">Oil, Gas &amp; Energy</span>
            </h1>
            <p className="mt-5 text-slate-300 text-base md:text-lg leading-relaxed max-w-xl">
              Discover 10,000+ jobs from top employers in Oil &amp; Gas, Renewable Energy, LNG,
              Petrochemicals, Power, Offshore &amp; more.
            </p>
          </div>

          {/* Search card */}
          <div className="mt-10 bg-white rounded-2xl shadow-2xl max-w-3xl overflow-hidden">
            <div className="flex flex-wrap text-sm font-semibold">
              <button className="px-6 py-3 text-blue-600 border-b-2 border-blue-600 flex items-center gap-2">
                <Briefcase size={15} /> Find Jobs
              </button>
              <button className="px-6 py-3 text-slate-500 flex items-center gap-2">
                <Building2 size={15} /> Find Companies
              </button>
            </div>
            <div className="p-4 flex flex-col md:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5">
                <Search size={16} className="text-slate-400" />
                <input
                  placeholder="Job title, keywords or company"
                  className="w-full text-sm outline-none placeholder:text-slate-400 text-slate-700"
                />
              </div>
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 md:w-48">
                <MapPin size={16} className="text-slate-400" />
                <span className="text-sm text-slate-500">All Countries</span>
              </div>
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 md:w-48">
                <Building2 size={16} className="text-slate-400" />
                <span className="text-sm text-slate-500">All Categories</span>
              </div>
              <Link
                href="/jobs"
                className="bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-semibold rounded-lg px-6 py-2.5 flex items-center justify-center gap-2"
              >
                <Search size={15} /> Search Jobs
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">Popular Searches:</span>
            {["Engineer", "HSE", "Drilling", "LNG", "QA/QC", "Pipeline", "Offshore"].map((t) => (
              <span
                key={t}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition-colors"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Browse Jobs by Category</h2>
          <Link href="/jobs" className="text-sm font-semibold text-blue-600 hover:underline">
            View All Categories
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((c) => (
            <Link
              href="/jobs"
              key={c.label}
              className="group border border-slate-200 rounded-xl p-5 text-center hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 mx-auto grid place-items-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors mb-3">
                <c.icon size={20} />
              </div>
              <p className="text-sm font-semibold text-slate-800">{c.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.count}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Featured Job Opportunities</h2>
            <Link href="/jobs" className="text-sm font-semibold text-blue-600 hover:underline">
              View All Jobs
            </Link>
          </div>
          <div className="space-y-4">
            {jobs.map((j) => (
              <div
                key={j.title}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-lg grid place-items-center font-bold text-sm shrink-0 ${j.logoBg}`}
                >
                  {j.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href="/jobs" className="font-semibold text-slate-900 hover:text-blue-600">
                    {j.title}
                  </Link>
                  <p className="text-sm text-blue-600 font-medium">{j.company}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin size={12} /> {j.location}
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
                    <Link
                      href="/jobs"
                      className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Apply Now
                    </Link>
                    <button className="w-9 h-9 grid place-items-center border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-300">
                      <Bookmark size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href="/jobs"
              className="px-6 py-2.5 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:border-blue-400 hover:text-blue-600 bg-white"
            >
              View All Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Employers */}
      <section className="mx-auto max-w-7xl px-6 py-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Featured Employers</h2>
          <Link href="/companies" className="text-sm font-semibold text-blue-600 hover:underline">
            View All Companies
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {employers.map((e) => (
            <div
              key={e}
              className="border border-slate-200 rounded-xl h-20 grid place-items-center font-bold text-slate-500 text-sm hover:border-blue-300 hover:shadow-md transition-all"
            >
              {e}
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#0B2B26]">
        <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-2 md:grid-cols-5 gap-8 text-white">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <s.icon size={22} className="mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section className="mx-auto max-w-7xl px-6 py-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Latest Articles &amp; Insights</h2>
          <Link href="/articles" className="text-sm font-semibold text-blue-600 hover:underline">
            View All Articles
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {articles.map((a) => (
            <div key={a.title} className="rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-all">
              <div className={`h-40 bg-gradient-to-br ${a.grad} relative`}>
                <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wide text-white bg-black/30 px-2.5 py-1 rounded">
                  {a.tag}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 leading-snug hover:text-blue-600 cursor-pointer">
                  {a.title}
                </h3>
                <p className="text-xs text-slate-400 mt-3">
                  {a.date} • {a.read}
                </p>
              </div>
            </div>
          ))}
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
              <h3 className="font-bold text-slate-900">Get the latest jobs &amp; industry insights</h3>
              <p className="text-sm text-slate-500">
                Subscribe to our newsletter and receive the best opportunities and career advice
                straight to your inbox.
              </p>
            </div>
          </div>
          <div className="flex w-full md:w-auto gap-2 shrink-0">
            <input
              placeholder="Enter your email address"
              className="flex-1 md:w-64 px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-400"
            />
            <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">
              Subscribe
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
          🔒 We respect your privacy. Unsubscribe at any time.
        </p>
      </section>

      <DarkFooter />
    </div>
  );
}