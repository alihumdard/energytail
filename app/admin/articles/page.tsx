"use client";

import { useState } from "react";
import Shell from "@/components/admin/Shell";
import { Badge, PageHeader, StatCard } from "@/components/admin/ShellUI";
import { allArticles } from "@/data/adminMockData";
import {
  Plus,
  Files,
  BadgeCheck,
  FileClock,
  FileEdit,
  CalendarClock,
  Trash2,
  Download,
  Search,
  Filter,
  Eye,
  Pencil,
  MoreVertical,
  ChevronDown,
} from "lucide-react";

const statusColor: Record<
  string,
  { badge: "green" | "amber" | "gray" | "blue"; dot: string }
> = {
  Published: { badge: "green", dot: "#16a34a" },
  "Pending Review": { badge: "amber", dot: "#d97706" },
  Draft: { badge: "gray", dot: "#6b7280" },
  Scheduled: { badge: "blue", dot: "#2563eb" },
};

const tabs = ["All Articles", "Published", "Pending Review", "Draft", "Scheduled", "Trash"];

const donutData = [
  { label: "Published", value: 512, pct: 67.7, color: "#16a34a" },
  { label: "Pending Review", value: 78, pct: 10.3, color: "#f59e0b" },
  { label: "Draft", value: 95, pct: 12.6, color: "#a855f7" },
  { label: "Scheduled", value: 41, pct: 5.4, color: "#2563eb" },
  { label: "Trash", value: 30, pct: 4.0, color: "#ef4444" },
];

function Donut() {
  const size = 180;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const segments = donutData.reduce<
    { label: string; color: string; dash: number; offset: number }[]
  >((acc, d) => {
    const offset = acc.reduce((sum, s) => sum + s.dash, 0);
    const dash = (d.pct / 100) * circumference;
    acc.push({ label: d.label, color: d.color, dash, offset });
    return acc;
  }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {segments.map((d) => (
          <circle
            key={d.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${d.dash} ${circumference - d.dash}`}
            strokeDashoffset={-d.offset}
          />
        ))}
      </g>
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        className="fill-gray-900"
        style={{ fontSize: 26, fontWeight: 700 }}
      >
        756
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        className="fill-gray-400"
        style={{ fontSize: 11 }}
      >
        Total Articles
      </text>
    </svg>
  );
}

export default function ArticlesManagementPage() {
  const [activeTab, setActiveTab] = useState("All Articles");

  return (
    <Shell>
      <PageHeader
        title="Articles Management"
        breadcrumb={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Articles" }]}
        actions={
          <button className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700">
            <Plus size={15} />
            Create New Article
          </button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Files} iconColor="text-blue-600" iconBg="bg-blue-50" value={756} label="Total Articles" meta="↑ 16.5% vs last month" metaColor="text-green-600" />
        <StatCard icon={BadgeCheck} iconColor="text-green-600" iconBg="bg-green-50" value={512} label="Published" meta="↑ 12.8% vs last month" metaColor="text-green-600" />
        <StatCard icon={FileClock} iconColor="text-amber-600" iconBg="bg-amber-50" value={78} label="Pending Review" meta="↓ 8.3% vs last month" metaColor="text-red-500" />
        <StatCard icon={FileEdit} iconColor="text-purple-600" iconBg="bg-purple-50" value={95} label="Draft" meta="↑ 5.2% vs last month" metaColor="text-green-600" />
        <StatCard icon={CalendarClock} iconColor="text-blue-600" iconBg="bg-blue-50" value={41} label="Scheduled" meta="↑ 16.1% vs last month" metaColor="text-green-600" />
        <StatCard icon={Trash2} iconColor="text-red-600" iconBg="bg-red-50" value={30} label="Trash" meta="↓ 3.6% vs last month" metaColor="text-red-500" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 rounded-xl border border-gray-200 bg-white shadow-card">
          <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-2 pt-2 sm:px-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-[13.5px] font-medium transition ${
                  activeTab === tab
                    ? "border-brand-600 text-brand-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <SelectMini options={["Bulk Actions", "Publish", "Move to Draft", "Delete"]} />
              <button className="rounded-lg bg-brand-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand-700">
                Apply
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50">
                <Download size={14} />
                Export
              </button>
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input placeholder="Search articles..." className="input w-44 pl-8 sm:w-52" />
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                <Filter size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 text-[12px] uppercase tracking-wide text-gray-400">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th className="px-3 py-3 font-medium">Article</th>
                  <th className="px-3 py-3 font-medium">Author</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Views</th>
                  <th className="px-3 py-3 font-medium">Comments</th>
                  <th className="px-3 py-3 font-medium">Published Date</th>
                  <th className="w-24 px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allArticles.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.image} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{a.title}</p>
                          <p className="truncate text-gray-400">{a.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-700">{a.author}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <Badge color={a.categoryColor}>{a.category}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <Badge color={statusColor[a.status].badge} dot>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600">{a.views}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600">{a.comments}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="text-gray-800">{a.date}</p>
                      {a.time && <p className="text-gray-400">{a.time}</p>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-1">
                        <IconBtn icon={Eye} />
                        <IconBtn icon={Pencil} />
                        <IconBtn icon={MoreVertical} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 p-4 sm:flex-row">
            <p className="text-[13px] text-gray-500">Showing 1 to 8 of 756 articles</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <button className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[13px] text-gray-400">‹</button>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`h-8 w-8 rounded-md text-[13px] font-medium ${
                    n === 1
                      ? "bg-brand-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="px-1 text-gray-400">...</span>
              <button className="h-8 w-8 rounded-md border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50">76</button>
              <button className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50">›</button>
              <SelectMini options={["10 / page", "25 / page", "50 / page"]} />
            </div>
          </div>
        </div>

        {/* Sidebar: overview + filters */}
        <div className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
            <h3 className="mb-4 text-[15px] font-semibold text-gray-900">
              Articles Overview
            </h3>
            <div className="flex items-center gap-5">
              <Donut />
              <ul className="space-y-2 text-[12.5px]">
                {donutData.map((d) => (
                  <li key={d.label} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-gray-600">{d.label}</span>
                    <span className="ml-auto font-medium text-gray-800">
                      {d.value} ({d.pct}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-gray-900">Filters</h3>
              <button className="text-[13px] font-medium text-brand-600 hover:text-brand-700">
                Clear All
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Category">
                <SelectField options={["All Categories", "Renewable Energy", "Oil & Gas", "LNG", "HSE"]} />
              </Field>
              <Field label="Author">
                <SelectField options={["All Authors", "John Smith", "Sarah Johnson"]} />
              </Field>
              <Field label="Status">
                <SelectField options={["All Status", "Published", "Pending Review", "Draft", "Scheduled"]} />
              </Field>
              <Field label="Date Range">
                <input placeholder="Select date range" className="input" />
              </Field>
              <Field label="Keyword">
                <input placeholder="Search by title or content..." className="input" />
              </Field>
              <button className="w-full rounded-lg bg-brand-600 py-2.5 text-[13.5px] font-medium text-white hover:bg-brand-700">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}

function SelectField({ options }: { options: string[] }) {
  return (
    <div className="relative">
      <select className="input appearance-none pr-8">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

function SelectMini({ options }: { options: string[] }) {
  return (
    <div className="relative">
      <select className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-7 text-[13px] text-gray-600 focus:border-brand-400 focus:outline-none">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

function IconBtn({ icon: Icon }: { icon: typeof Eye }) {
  return (
    <button className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100">
      <Icon size={14} />
    </button>
  );
}
