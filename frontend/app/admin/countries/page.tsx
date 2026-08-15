import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminDonutChart from "@/components/admin/AdminDonutChart";
import {
  AdminStatusBadge,
  AdminToolbar,
  AdminPagination,
  AdminRowActions,
  AdminTopList,
  AdminQuickTips,
} from "@/components/admin/AdminBits";
import { Globe, ShieldCheck, Briefcase } from "lucide-react";
import { countries as d } from "@/lib/admin-data";

export const metadata = { title: "Countries · Energy Tail Admin" };

export default function CountriesPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar active="countries" />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar variant="dark" />

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          <AdminPageHeader crumbs={["Dashboard", "Countries"]} title="Countries" addLabel="Add New Country" />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <AdminStatCard icon={Globe} tone="blue" label="Total Countries" value={d.stats.total} hint="All countries" />
            <AdminStatCard icon={ShieldCheck} tone="green" label="Active Countries" value={d.stats.active} hint="Currently active" />
            <AdminStatCard icon={Globe} tone="orange" label="Inactive Countries" value={d.stats.inactive} hint="Currently inactive" />
            <AdminStatCard icon={Briefcase} tone="purple" label="Total Jobs" value={d.stats.jobs.toLocaleString()} hint="Across all countries" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="min-w-0 bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <AdminToolbar searchPlaceholder="Search countries..." />
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-t border-b border-slate-100 text-[12px] font-semibold text-slate-400 uppercase tracking-wide">
                      <th className="px-5 py-3 w-8"><input type="checkbox" /></th>
                      <th className="px-2 py-3">Country Name</th>
                      <th className="px-2 py-3">Code</th>
                      <th className="px-2 py-3">Regions</th>
                      <th className="px-2 py-3">Jobs Count</th>
                      <th className="px-2 py-3">Status</th>
                      <th className="px-2 py-3">Order</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.rows.map((r) => (
                      <tr key={r.code} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3.5"><input type="checkbox" /></td>
                        <td className="px-2 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg leading-none">{r.flag}</span>
                            <span className="text-[13.5px] font-semibold text-slate-800">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3.5 text-[13px] text-slate-500">{r.code}</td>
                        <td className="px-2 py-3.5 text-[13px] text-slate-500">{r.region}</td>
                        <td className="px-2 py-3.5 text-[13.5px] font-semibold text-blue-600">{r.jobs.toLocaleString()}</td>
                        <td className="px-2 py-3.5"><AdminStatusBadge active={r.active} /></td>
                        <td className="px-2 py-3.5 text-[13px] text-slate-500">{r.order}</td>
                        <td className="px-5 py-3.5"><AdminRowActions /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AdminPagination page={1} totalPages={d.pages} text={d.showing} />
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="text-[14px] font-bold text-slate-900 mb-4">Countries by Region</div>
                <AdminDonutChart data={d.donut} total={d.stats.total} />
              </div>
              <AdminTopList title="Top Countries by Jobs" items={d.top} footerLabel="View all countries" />
              <AdminQuickTips tips={d.tips} />
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-2">© 2025 Energy Tail. All rights reserved.</div>
        </main>
      </div>
    </div>
  );
}