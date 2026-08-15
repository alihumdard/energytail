"use client";

import DashboardLayout from "@/components/admin/DashboardLayout";
import { Breadcrumb, StatCard, StatusBadge, DonutChart } from "@/components/admin/DashboardUI";
import { companies } from "@/data/mockData";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  Users,
  ShieldAlert,
  Plus,
  Download,
  Search,
  Eye,
  Pencil,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function CompaniesPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies Management</h1>
          <div className="mt-1">
            <Breadcrumb items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Companies" }]} />
          </div>
        </div>
        <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm self-start lg:self-auto">
          <Plus size={16} />
          Add New Company
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              icon={Building2}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              label="Total Companies"
              value="1,253"
              delta="14.2%"
              deltaUp
            />
            <StatCard
              icon={Briefcase}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              label="Active Companies"
              value="1,098"
              delta="12.8%"
              deltaUp
            />
            <StatCard
              icon={Users}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
              label="Pending Approval"
              value="42"
              delta="5.3%"
              deltaUp
            />
            <StatCard
              icon={ShieldAlert}
              iconBg="bg-red-50"
              iconColor="text-red-500"
              label="Suspended"
              value="18"
              delta="10.5%"
              deltaUp={false}
            />
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
                  placeholder="Search companies..."
                  className="pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/30 w-40 sm:w-52"
                />
              </div>
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
                    <th className="p-4 font-medium whitespace-nowrap">Company</th>
                    <th className="p-4 font-medium whitespace-nowrap">Industry</th>
                    <th className="p-4 font-medium whitespace-nowrap">Location</th>
                    <th className="p-4 font-medium whitespace-nowrap">Jobs</th>
                    <th className="p-4 font-medium whitespace-nowrap">Status</th>
                    <th className="p-4 font-medium whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        Joined Date <ChevronDown size={13} />
                      </span>
                    </th>
                    <th className="p-4 font-medium whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                      <td className="p-4">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-8 h-8 rounded-md flex items-center justify-center text-sm ${c.logoColor}`}>
                            {c.logo}
                          </span>
                          <div>
                            <Link
                              href={`/admin/companies/${c.id}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {c.name}
                            </Link>
                            <p className="text-xs text-gray-400">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 whitespace-nowrap">{c.industry}</td>
                      <td className="p-4 text-gray-600 whitespace-nowrap">{c.location}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-blue-600 font-medium">{c.jobs}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="p-4 text-gray-600 whitespace-nowrap">{c.joinedDate}</td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Link
                            href={`/admin/companies/${c.id}`}
                            className="p-1.5 hover:bg-gray-100 rounded-md hover:text-blue-600"
                          >
                            <Eye size={16} />
                          </Link>
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
              <p className="text-sm text-gray-500">Showing 1 to 10 of 1,253 companies</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button className="p-1.5 border border-gray-200 rounded-md text-gray-400 hover:bg-gray-50">
                  <ChevronLeft size={15} />
                </button>
                {[1, 2, 3].map((p) => (
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
                  126
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
            <h3 className="font-semibold text-gray-900 mb-4">Company Summary</h3>
            <div className="flex flex-col items-center">
              <DonutChart
                total={1253}
                totalLabel="Total Companies"
                data={[
                  { label: "Active", value: 1098, pct: 87.6, color: "#22c55e" },
                  { label: "Pending", value: 42, pct: 3.4, color: "#f97316" },
                  { label: "Suspended", value: 18, pct: 1.4, color: "#ef4444" },
                  { label: "Inactive", value: 95, pct: 7.6, color: "#60a5fa" },
                ]}
              />
              <div className="w-full mt-4 space-y-2.5">
                {[
                  { label: "Active", value: "1,098", pct: "(87.6%)", color: "bg-green-500" },
                  { label: "Pending", value: "42", pct: "(3.4%)", color: "bg-orange-500" },
                  { label: "Suspended", value: "18", pct: "(1.4%)", color: "bg-red-500" },
                  { label: "Inactive", value: "95", pct: "(7.6%)", color: "bg-blue-400" },
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
              <SelectField label="Status" placeholder="All Status" />
              <SelectField label="Industry" placeholder="All Industries" />
              <SelectField label="Country" placeholder="All Countries" />
              <Field label="Joined Date">
                <button className="w-full flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-50">
                  Select date range
                </button>
              </Field>
              <Field label="Search">
                <input
                  placeholder="Search by company name or email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </Field>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2">
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
