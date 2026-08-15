"use client";

import { useState } from "react";
import DashboardLayout from "@/components/admin/DashboardLayout";
import { Breadcrumb, StatCard, StatusBadge, DonutChart } from "@/components/admin/DashboardUI";
import { jobs } from "@/data/mockData";
import {
  Briefcase,
  ClipboardList,
  FileEdit,
  AlertTriangle,
  Archive,
  Plus,
  ChevronDown,
  Download,
  Search,
  SlidersHorizontal,
  Eye,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const tabs = ["All Jobs", "Published", "Draft", "Pending Review", "Expired", "Closed"];

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState("All Jobs");

  const filteredJobs =
    activeTab === "All Jobs"
      ? jobs
      : jobs.filter((j) => j.status === activeTab);

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs Management</h1>
          <div className="mt-1">
            <Breadcrumb items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Jobs" }]} />
          </div>
        </div>
        <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm self-start lg:self-auto">
          <Plus size={16} />
          Post New Job
          <ChevronDown size={14} className="ml-1 opacity-80" />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              icon={Briefcase}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              label="Total Jobs"
              value="1,248"
              delta="14.6%"
              deltaUp
            />
            <StatCard
              icon={ClipboardList}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              label="Published"
              value="842"
              delta="12.3%"
              deltaUp
            />
            <StatCard
              icon={FileEdit}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
              label="Draft"
              value="156"
              delta="4.2%"
              deltaUp={false}
            />
            <StatCard
              icon={AlertTriangle}
              iconBg="bg-red-50"
              iconColor="text-red-500"
              label="Expired"
              value="180"
              delta="3.1%"
              deltaUp
            />
            <StatCard
              icon={Archive}
              iconBg="bg-gray-100"
              iconColor="text-gray-500"
              label="Closed"
              value="70"
              delta="2.7%"
              deltaUp={false}
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-gray-200 mb-4 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
                Bulk Actions
                <ChevronDown size={14} />
              </button>
              <button className="text-sm text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50">
                Apply
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 hover:bg-blue-100">
                <Download size={15} />
                Export
              </button>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Search jobs..."
                  className="pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/30 w-40 sm:w-48"
                />
              </div>
              <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="p-4 w-10">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="p-4 font-medium whitespace-nowrap">Job Title</th>
                    <th className="p-4 font-medium whitespace-nowrap">Company</th>
                    <th className="p-4 font-medium whitespace-nowrap">Location</th>
                    <th className="p-4 font-medium whitespace-nowrap">Job Type</th>
                    <th className="p-4 font-medium whitespace-nowrap">Posted Date</th>
                    <th className="p-4 font-medium whitespace-nowrap">Deadline</th>
                    <th className="p-4 font-medium whitespace-nowrap">Status</th>
                    <th className="p-4 font-medium whitespace-nowrap">Views</th>
                    <th className="p-4 font-medium whitespace-nowrap">Apply Clicks</th>
                    <th className="p-4 font-medium whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                      <td className="p-4">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <p className="font-medium text-blue-600">{job.title}</p>
                        <p className="text-xs text-gray-400">{job.id}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-md flex items-center justify-center text-sm ${job.companyColor}`}>
                            {job.companyLogo}
                          </span>
                          <span className="text-gray-700">{job.company}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 whitespace-nowrap">{job.location}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            job.type === "Contract"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {job.type}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 whitespace-nowrap">{job.posted}</td>
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-gray-700">{job.deadline}</p>
                        <p
                          className={`text-xs ${
                            job.deadlineNote === "Expired" ? "text-red-500" : "text-gray-400"
                          }`}
                        >
                          {job.deadlineNote}
                        </p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="p-4 text-gray-600 whitespace-nowrap">{job.views.toLocaleString()}</td>
                      <td className="p-4 text-gray-600 whitespace-nowrap">{job.clicks}</td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-400">
                          <button className="p-1.5 hover:bg-gray-100 rounded-md hover:text-blue-600">
                            <Eye size={16} />
                          </button>
                          <button className="p-1.5 hover:bg-gray-100 rounded-md hover:text-blue-600">
                            <Pencil size={16} />
                          </button>
                          <button className="p-1.5 hover:bg-gray-100 rounded-md hover:text-blue-600">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Showing 1 to 10 of 1,248 jobs</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button className="p-1.5 border border-gray-200 rounded-md text-gray-400 hover:bg-gray-50">
                  <ChevronLeft size={15} />
                </button>
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    className={`w-8 h-8 rounded-md text-sm font-medium ${
                      p === 1
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <span className="px-1 text-gray-400">...</span>
                <button className="w-8 h-8 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">
                  125
                </button>
                <button className="p-1.5 border border-gray-200 rounded-md text-gray-400 hover:bg-gray-50">
                  <ChevronRight size={15} />
                </button>
                <select className="ml-2 text-sm border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 outline-none">
                  <option>10 / page</option>
                  <option>25 / page</option>
                  <option>50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Job Statistics</h3>
            <div className="flex flex-col items-center">
              <DonutChart
                total={1248}
                totalLabel="Total Jobs"
                data={[
                  { label: "Published", value: 842, pct: 67.6, color: "#22c55e" },
                  { label: "Draft", value: 166, pct: 12.5, color: "#f97316" },
                  { label: "Expired", value: 180, pct: 14.4, color: "#ef4444" },
                  { label: "Closed", value: 70, pct: 5.6, color: "#94a3b8" },
                ]}
              />
              <div className="w-full mt-4 space-y-2.5">
                {[
                  { label: "Published", value: "842", pct: "(67.6%)", color: "bg-green-500" },
                  { label: "Draft", value: "166", pct: "(12.5%)", color: "bg-orange-500" },
                  { label: "Expired", value: "180", pct: "(14.4%)", color: "bg-red-500" },
                  { label: "Closed", value: "70", pct: "(5.6%)", color: "bg-slate-400" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <span className={`w-2 h-2 rounded-full ${row.color}`} />
                      {row.label}
                    </span>
                    <span className="text-gray-700 font-medium">
                      {row.value} <span className="text-gray-400 font-normal">{row.pct}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button className="text-xs text-blue-600 font-medium">Clear All</button>
            </div>
            <div className="space-y-4">
              <Field label="Keyword">
                <input
                  placeholder="Search by title or ID..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </Field>
              <SelectField label="Company" placeholder="All Companies" />
              <SelectField label="Job Category" placeholder="All Categories" />
              <SelectField label="Location" placeholder="All Locations" />
              <SelectField label="Job Type" placeholder="All Types" />
              <SelectField label="Status" placeholder="All Status" />
              <Field label="Date Posted">
                <button className="w-full flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-50">
                  Select date range
                </button>
              </Field>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2">
                <SlidersHorizontal size={15} />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SelectField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <Field label={label}>
      <div className="relative">
        <select className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-500/30 bg-white">
          <option>{placeholder}</option>
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </Field>
  );
}
