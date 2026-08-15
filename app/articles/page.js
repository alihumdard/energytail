"use client";

import Link from "next/link";
import { PublicHeader, DarkFooter, Avatar } from "@/components/Shared";
import {
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
} from "lucide-react";

const categories = [
  { name: "All Categories", count: null, checked: true },
  { name: "Industry News", count: 125 },
  { name: "Technology", count: 98 },
  { name: "Career Advice", count: 156 },
  { name: "Market Insights", count: 134 },
  { name: "Sustainability", count: 87 },
  { name: "Operations", count: 63 },
  { name: "Health & Safety", count: 45 },
];

const authorTypes = [
  { name: "All Authors", count: null, checked: true },
  { name: "Experts", count: 152 },
  { name: "Company", count: 86 },
  { name: "Guest Authors", count: 45 },
];

const tagTone = {
  "Industry News": "bg-brand-50 text-brand-500",
  Technology: "bg-emerald-50 text-emerald-600",
  "Career Advice": "bg-violet-50 text-violet-600",
  Sustainability: "bg-emerald-50 text-emerald-600",
  Operations: "bg-amber-50 text-amber-600",
  "Health & Safety": "bg-rose-50 text-rose-600",
  "Market Insights": "bg-brand-50 text-brand-500",
};

const articles = [
  {
    img: "ph-rig",
    tag: "Industry News",
    date: "May 21, 2025",
    title: "Global Oil Prices See Major Shifts in 2025",
    desc: "An in-depth analysis of the factors influencing oil prices and what to expect in the coming months.",
    author: "Michael Brown",
    role: "Energy Market Analyst",
    read: "5 min read",
  },
  {
    img: "ph-ai",
    tag: "Technology",
    date: "May 20, 2025",
    title: "How AI is Transforming Oil & Gas Operations",
    desc: "Artificial Intelligence is optimizing exploration, production and maintenance like never before.",
    author: "Sarah Johnson",
    role: "Technology Expert",
    read: "6 min read",
    tone: "woman",
  },
  {
    img: "ph-wind",
    tag: "Career Advice",
    date: "May 19, 2025",
    title: "Top Skills Oil & Gas Employers Need in 2025",
    desc: "The most in-demand skills that can boost your career in the energy sector.",
    author: "David Wilson",
    role: "HR Manager",
    read: "4 min read",
  },
  {
    img: "ph-green",
    tag: "Sustainability",
    date: "May 18, 2025",
    title: "Sustainability Initiatives Shaping the Energy Future",
    desc: "How companies are investing in clean energy and reducing carbon footprints.",
    author: "Emma Davis",
    role: "Sustainability Lead",
    read: "7 min read",
    tone: "woman",
  },
  {
    img: "ph-plant",
    tag: "Operations",
    date: "May 17, 2025",
    title: "Improving Operational Efficiency in Refineries",
    desc: "Best practices and technologies enhancing refinery performance and reliability.",
    author: "James Anderson",
    role: "Operations Specialist",
    read: "6 min read",
  },
  {
    img: "ph-safety",
    tag: "Health & Safety",
    date: "May 16, 2025",
    title: "Enhancing Safety Culture in High-Risk Environments",
    desc: "Key strategies to build a strong safety culture and prevent workplace incidents.",
    author: "Lisa Martinez",
    role: "HSE Advisor",
    read: "5 min read",
    tone: "woman",
  },
  {
    img: "ph-chart",
    tag: "Market Insights",
    date: "May 15, 2025",
    title: "Energy Market Outlook: Key Trends to Watch",
    desc: "Expert insights on market trends, supply demand and investment opportunities.",
    author: "Robert Taylor",
    role: "Market Analyst",
    read: "8 min read",
    href: "/article-details",
  },
  {
    img: "ph-ship",
    tag: "Industry News",
    date: "May 14, 2025",
    title: "LNG Demand Continues to Rise Across Asia",
    desc: "A look at the growing LNG market and its impact on the global energy landscape.",
    author: "Priya Sharma",
    role: "Energy Correspondent",
    read: "5 min read",
    tone: "woman",
  },
];

function Checkbox({ label, count, checked }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[13px] text-ink-700">
      <input
        type="checkbox"
        defaultChecked={checked}
        className="h-[17px] w-[17px] rounded border-[#cbd5e1] text-brand-500 focus:ring-brand-500"
      />
      <span className="flex-1">{label}</span>
      {count !== null && count !== undefined && (
        <span className="text-[12px] text-ink-500">{count}</span>
      )}
    </label>
  );
}

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <PublicHeader active="Articles" />

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#eef4fd] via-[#eaf1fb] to-[#dfeaf8] px-6 py-9 sm:px-9">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] md:block">
            <div className="absolute bottom-0 right-[6%] h-[70%] w-[36%] rounded-t-sm bg-[#b9d2ee] [clip-path:polygon(20%_0,80%_0,100%_100%,0_100%)]" />
            <div className="absolute bottom-0 right-[34%] h-[54%] w-[26%] rounded-t-sm bg-[#c9dcf1] [clip-path:polygon(22%_0,78%_0,100%_100%,0_100%)]" />
            {[8, 20, 30].map((r, i) => (
              <div key={r} style={{ right: `${r}%`, height: `${44 - i * 8}%` }} className="absolute bottom-0 w-px bg-[#a9c6e6]">
                <span className="absolute -left-4 -top-4 h-8 w-8 rounded-full border-2 border-[#a9c6e6]" />
              </div>
            ))}
          </div>
          <h1 className="relative text-[32px] font-extrabold tracking-tight sm:text-[38px]">
            Articles
          </h1>
          <p className="relative mt-2 max-w-lg text-[13.5px] text-ink-700">
            Insights, trends and expert advice from the oil, gas and energy industry.
          </p>
          <p className="relative mt-3 text-[12.5px] font-semibold text-ink-500">
            1,248 articles available
          </p>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[268px_minmax(0,1fr)]">
          {/* Filters */}
          <aside className="card h-fit w-full min-w-0 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-bold">Filters</h3>
              <button className="text-[12.5px] font-semibold text-brand-500">Clear All</button>
            </div>

            <p className="mb-2 text-[13px] font-bold">Search Articles</p>
            <div className="relative mb-6">
              <input className="input pr-10" placeholder="Search articles..." />
              <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-bold">Categories</p>
              <ChevronDown className="h-4 w-4 text-ink-500" />
            </div>
            <div className="mb-6">
              {categories.map((c) => (
                <Checkbox key={c.name} label={c.name} count={c.count} checked={c.checked} />
              ))}
            </div>

            <p className="mb-2 text-[13px] font-bold">Industry</p>
            <select className="select mb-6">
              <option>All Industries</option>
              <option>Oil &amp; Gas</option>
              <option>Renewable Energy</option>
            </select>

            <p className="mb-2 text-[13px] font-bold">Author Type</p>
            <div className="mb-6">
              {authorTypes.map((a) => (
                <Checkbox key={a.name} label={a.name} count={a.count} checked={a.checked} />
              ))}
            </div>

            <p className="mb-2 text-[13px] font-bold">Date</p>
            <select className="select mb-5">
              <option>Anytime</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>

            <button className="btn-primary w-full">
              <SlidersHorizontal className="h-4 w-4" /> Apply Filters
            </button>
          </aside>

          {/* Results */}
          <div className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="flex gap-6 border-b border-[#e8edf5]">
                {["All Articles", "Trending", "Latest"].map((t, i) => (
                  <button
                    key={t}
                    className={`relative pb-3 text-[13.5px] font-semibold ${
                      i === 0 ? "text-brand-500" : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    {t}
                    {i === 0 && (
                      <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-brand-500" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
                <span className="text-[13px] font-semibold text-ink-500">Sort by:</span>
                <select className="select h-10 w-[140px] text-[12.5px]">
                  <option>Latest First</option>
                  <option>Oldest First</option>
                  <option>Most Read</option>
                </select>
                <div className="flex overflow-hidden rounded-lg border border-[#dfe6f1]">
                  <button className="grid h-10 w-10 place-items-center bg-brand-500 text-white">
                    <LayoutGrid className="h-[17px] w-[17px]" />
                  </button>
                  <button className="grid h-10 w-10 place-items-center bg-white text-ink-500 hover:text-brand-500">
                    <List className="h-[17px] w-[17px]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {articles.map((a) => (
                <Link
                  href={a.href || "/article-details"}
                  key={a.title}
                  className="card group min-w-0 overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className={`ph ${a.img} h-[132px]`}>
                    <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-black/35 text-white backdrop-blur">
                      <Bookmark className="h-[15px] w-[15px]" />
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className={`chip ${tagTone[a.tag]}`}>{a.tag}</span>
                      <span className="text-[11.5px] text-ink-500">{a.date}</span>
                    </div>
                    <h3 className="text-[15px] font-extrabold leading-snug group-hover:text-brand-500">
                      {a.title}
                    </h3>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">{a.desc}</p>
                    <div className="mt-4 flex items-center gap-2.5 border-t border-[#f1f5f9] pt-3.5">
                      <Avatar size={30} tone={a.tone || "man"} />
                      <span className="leading-tight">
                        <span className="block text-[12px] font-bold">{a.author}</span>
                        <span className="block text-[11px] text-ink-500">{a.role}</span>
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-[11px] text-ink-500">
                        <Clock className="h-3.5 w-3.5" /> {a.read}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-7 flex flex-col items-center gap-4 xl:flex-row">
              <p className="text-[12.5px] text-ink-500">Showing 1 to 12 of 1,248 articles</p>

              <div className="flex flex-wrap items-center justify-center gap-1.5 xl:mx-auto">
                {[ChevronsLeft, ChevronLeft].map((Icon, i) => (
                  <button
                    key={i}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe6f1] bg-white text-ink-500 hover:text-brand-500"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
                {["1", "2", "3", "...", "104"].map((p, i) => (
                  <button
                    key={p}
                    className={`h-9 min-w-9 rounded-lg px-2.5 text-[12.5px] font-semibold ${
                      i === 0
                        ? "bg-brand-500 text-white"
                        : "border border-[#dfe6f1] bg-white text-ink-700 hover:text-brand-500"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {[ChevronRight, ChevronsRight].map((Icon, i) => (
                  <button
                    key={i}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe6f1] bg-white text-ink-500 hover:text-brand-500"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-[12.5px] text-ink-500">Articles per page:</span>
                <select className="select h-9 w-[76px] text-[12.5px]">
                  <option>12</option>
                  <option>24</option>
                  <option>48</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DarkFooter />
    </div>
  );
}
