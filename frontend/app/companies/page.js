"use client";

import { MarketingTopStrip, MarketingHeader, DarkFooter } from "@/components/Shared";
import {
  Bookmark,
  Building2,
  BadgeCheck,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  List,
  MapPin,
  Mail,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";

const locations = [
  ["United Arab Emirates", 124],
  ["Saudi Arabia", 98],
  ["Qatar", 76],
  ["United States", 64],
  ["Canada", 42],
];

const industries = [
  ["Oil & Gas", 156],
  ["Renewable Energy", 84],
  ["Petrochemical", 68],
  ["Engineering Services", 52],
  ["Energy Equipment", 38],
];

const sizes = [
  ["1 – 50 employees", 48],
  ["51 – 200 employees", 76],
  ["201 – 1000 employees", 64],
  ["1001 – 5000 employees", 36],
  ["5000+ employees", 28],
];

const companies = [
  {
    name: "Saudi Aramco",
    industry: "Oil & Gas",
    loc: "Dhahran, Saudi Arabia",
    jobs: "126 Open Jobs",
    size: "10,001+ Employees",
    verified: true,
    logo: "bg-gradient-to-br from-[#8fd14f] to-[#0f9d58]",
    mark: "✦",
  },
  {
    name: "ADNOC Group",
    industry: "Oil & Gas",
    loc: "Abu Dhabi, UAE",
    jobs: "84 Open Jobs",
    size: "5,001 – 10,000 Employees",
    verified: true,
    logo: "bg-white border border-[#e2e8f2]",
    mark: "A",
    markColor: "text-[#0b4ea2]",
  },
  {
    name: "Shell",
    industry: "Oil & Gas",
    loc: "The Hague, Netherlands",
    jobs: "73 Open Jobs",
    size: "10,001+ Employees",
    verified: true,
    logo: "bg-[#fbbf24]",
    mark: "◍",
    markColor: "text-[#dc2626]",
  },
  {
    name: "TotalEnergies",
    industry: "TotalEnergies",
    loc: "Paris, France",
    jobs: "68 Open Jobs",
    size: "10,001+ Employees",
    verified: true,
    logo: "bg-gradient-to-br from-[#ef4444] via-[#f59e0b] to-[#3b82f6]",
    mark: "∞",
  },
  {
    name: "ExxonMobil",
    industry: "Oil & Gas",
    loc: "Houston, United States",
    jobs: "62 Open Jobs",
    size: "10,001+ Employees",
    logo: "bg-white border border-[#e2e8f2]",
    mark: "E",
    markColor: "text-[#e11d48]",
  },
  {
    name: "BP",
    industry: "Oil & Gas",
    loc: "London, United Kingdom",
    jobs: "58 Open Jobs",
    size: "10,001+ Employees",
    logo: "bg-gradient-to-br from-[#a3e635] to-[#15803d]",
    mark: "❋",
  },
  {
    name: "Chevron",
    industry: "Oil & Gas",
    loc: "San Ramon, United States",
    jobs: "47 Open Jobs",
    size: "5,001 – 10,000 Employees",
    logo: "bg-gradient-to-b from-[#1d4ed8] via-white to-[#dc2626]",
    mark: "▮",
    markColor: "text-white",
  },
  {
    name: "Baker Hughes",
    industry: "Energy Equipment",
    loc: "Houston, United States",
    jobs: "39 Open Jobs",
    size: "10,001+ Employees",
    logo: "bg-white border border-[#e2e8f2]",
    mark: "≋",
    markColor: "text-[#0d9488]",
  },
];

function FilterGroup({ title, items, more }) {
  return (
    <div className="mb-6">
      <p className="mb-2.5 text-[13px] font-bold">{title}</p>
      {items.map(([name, count]) => (
        <label
          key={name}
          className="flex cursor-pointer items-center gap-2.5 py-[5px] text-[12.5px] text-ink-700"
        >
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#cbd5e1] text-brand-500 focus:ring-brand-500"
          />
          <span className="flex-1">{name}</span>
          <span className="text-[12px] text-ink-500">({count})</span>
        </label>
      ))}
      {more && (
        <button className="mt-1.5 flex items-center gap-1 text-[12.5px] font-semibold text-brand-500">
          + Show More
        </button>
      )}
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <MarketingTopStrip />
      <MarketingHeader active="Companies" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0B2B26]">
        <div className="absolute inset-0 opacity-30">
          <div className="ph-city absolute inset-0" />
          <div className="absolute bottom-0 left-[55%] right-0 h-2/3 bg-[linear-gradient(90deg,transparent,rgba(255,190,120,.35),transparent)]" />
        </div>
        <div className="relative mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <nav className="mb-5 flex items-center gap-2 text-[12.5px] text-white/70">
            <span>Home</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">Companies</span>
          </nav>
          <h1 className="text-[30px] font-extrabold tracking-tight text-white sm:text-[36px]">
            Top Energy Companies
          </h1>
          <p className="mt-2.5 max-w-lg text-[13.5px] leading-relaxed text-white/75">
            Discover and explore leading oil, gas &amp; energy companies hiring top talent worldwide.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Search bar */}
        <div className="relative z-10 -mt-8 rounded-xl border border-[#e8edf5] bg-white p-3 shadow-card">
          <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                className="input pl-10"
                placeholder="Search company name, industry or keyword..."
              />
            </div>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <select className="select pl-10">
                <option>All Locations</option>
                <option>United Arab Emirates</option>
                <option>Saudi Arabia</option>
              </select>
            </div>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <select className="select pl-10">
                <option>All Industries</option>
                <option>Oil &amp; Gas</option>
                <option>Renewable Energy</option>
              </select>
            </div>
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <select className="select pl-10">
                <option>Sort by: Featured</option>
                <option>Sort by: Most Jobs</option>
                <option>Sort by: A – Z</option>
              </select>
            </div>
            <button className="btn-primary relative z-10 px-7">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 pb-10 lg:grid-cols-[290px_minmax(0,1fr)]">
          {/* Filters */}
          <aside className="card h-fit p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[15px] font-bold">Filters</h3>
              <button className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-500">
                Reset All <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="mb-2.5 text-[13px] font-bold">Location</p>
            <div className="relative mb-3">
              <input className="input h-10 pl-9 text-[12.5px]" placeholder="Search country or city" />
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            </div>
            <FilterGroup title="" items={locations} more />
            <FilterGroup title="Industry" items={industries} more />
            <FilterGroup title="Company Size" items={sizes} />

            <button className="h-11 w-full rounded-lg border border-[#dbe4f2] bg-white text-[13px] font-semibold text-ink-700 hover:bg-slate-50">
              Apply Filters
            </button>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-4">
              <p className="text-[14px] font-semibold text-ink-700">
                <span className="text-[17px] font-extrabold text-brand-500">236</span> Companies
                Found
              </p>
              <div className="ml-auto flex overflow-hidden rounded-lg border border-[#dfe6f1]">
                <button className="flex h-10 items-center gap-2 bg-brand-50 px-4 text-[12.5px] font-semibold text-brand-500">
                  <LayoutGrid className="h-4 w-4" /> Grid View
                </button>
                <button className="flex h-10 items-center gap-2 bg-white px-4 text-[12.5px] font-semibold text-ink-500 hover:text-brand-500">
                  <List className="h-4 w-4" /> List View
                </button>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {companies.map((c) => (
                <div key={c.name} className="card relative p-5 text-center transition hover:shadow-lg">
                  {c.verified && (
                    <span className="absolute left-0 top-0 flex items-center gap-1 rounded-br-lg rounded-tl-xl bg-brand-500 px-2.5 py-1 text-[10.5px] font-bold text-white">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                  <button className="absolute right-4 top-4 text-ink-500 hover:text-brand-500">
                    <Bookmark className="h-4 w-4" />
                  </button>

                  <div
                    className={`mx-auto mb-4 mt-5 grid h-[62px] w-[62px] place-items-center rounded-lg text-[26px] font-black ${c.logo} ${
                      c.markColor || "text-white"
                    }`}
                  >
                    {c.mark}
                  </div>

                  <h3 className="text-[15px] font-extrabold">{c.name}</h3>
                  <p className="mt-1 text-[12px] text-ink-500">{c.industry}</p>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-ink-500">
                    <MapPin className="h-3.5 w-3.5" /> {c.loc}
                  </p>
                  <p className="mt-2.5 text-[12.5px] font-bold text-brand-500">{c.jobs}</p>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-ink-500">
                    <Users className="h-3.5 w-3.5" /> {c.size}
                  </p>

                  <button className="mt-4 h-10 w-full rounded-lg border border-brand-500/60 text-[12.5px] font-semibold text-brand-500 hover:bg-brand-50">
                    View Profile
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-7 flex flex-col items-center gap-4 sm:flex-row">
              <div className="flex flex-wrap items-center gap-1.5 sm:mx-auto">
                <button className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe6f1] bg-white text-ink-500 hover:text-brand-500">
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                {["1", "2", "3", "4", "5", "...", "12"].map((p, i) => (
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
                <button className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe6f1] bg-white text-ink-500 hover:text-brand-500">
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[12.5px] text-ink-500">Showing 1 to 12 of 236 companies</p>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <section className="mb-10 rounded-xl border border-[#e8edf5] bg-white p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
              <Mail className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-[16px] font-extrabold">Stay updated with top energy companies</h3>
              <p className="mt-1 text-[12.5px] text-ink-500">
                Subscribe to get the latest company updates, job openings and industry insights.
              </p>
            </div>
            <div className="flex w-full gap-3 lg:ml-auto lg:w-auto">
              <input
                className="input w-full lg:w-[300px]"
                placeholder="Enter your email address"
              />
              <button className="btn-primary shrink-0 px-7">Subscribe</button>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 text-[12px] text-ink-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> We respect your privacy. Unsubscribe
            at any time.
          </p>
        </section>
      </div>

      <DarkFooter />
    </div>
  );
}