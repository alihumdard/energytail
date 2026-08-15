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
import { LayoutGrid, ShieldCheck, Briefcase } from "lucide-react";
import { skills as d } from "@/lib/admin-data";

export const metadata = { title: "Skills · Energy Tail Admin" };

const demandTone: Record<string, string> = {
  "Very High": "bg-emerald-50 text-emerald-600",
  High: "bg-blue-50 text-blue-600",
  Medium: "bg-amber-50 text-amber-600",
};

export default function SkillsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar active="skills" />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar variant="dark" />

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          <AdminPageHeader crumbs={["Dashboard", "Skills"]} title="Skills" addLabel="Add New Skill" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <AdminStatCard icon={LayoutGrid} tone="blue" label="Total Skills" value={d.stats.total} hint="All skills in system" />
            <AdminStatCard icon={ShieldCheck} tone="green" label="Active Skills" value={d.stats.active} hint="Currently active" />
            <AdminStatCard icon={LayoutGrid} tone="orange" label="Inactive Skills" value={d.stats.inactive} hint="Currently inactive" />
            <AdminStatCard icon={Briefcase} tone="purple" label="Skills in Demand" value={d.stats.demand} hint="High demand skills" />
            <AdminStatCard icon={Briefcase} tone="blue" label="Jobs Using Skills" value={d.stats.jobs.toLocaleString()} hint="Across all jobs" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="min-w-0 bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <AdminToolbar searchPlaceholder="Search skills..." />
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-t border-b border-slate-100 text-[12px] font-semibold text-slate-400 uppercase tracking-wide">
                      <th className="px-5 py-3 w-8"><input type="checkbox" /></th>
                      <th className="px-2 py-3">Skill Name</th>
                      <th className="px-2 py-3">Category</th>
                      <th className="px-2 py-3">Jobs Count</th>
                      <th className="px-2 py-3">Demand</th>
                      <th className="px-2 py-3">Status</th>
                      <th className="px-2 py-3">Order</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.rows.map((r) => (
                      <tr key={r.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3.5"><input type="checkbox" /></td>
                        <td className="px-2 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0"
                              style={{ background: r.color + "1a", color: r.color }}
                            >
                              {r.icon}
                            </div>
                            <div className="text-[13.5px] font-semibold text-slate-800">{r.name}</div>
                          </div>
                        </td>
                        <td className="px-2 py-3.5">
                          <span className="text-[12px] font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                            {r.category}
                          </span>
                        </td>
                        <td className="px-2 py-3.5 text-[13.5px] font-semibold text-blue-600">{r.jobs.toLocaleString()}</td>
                        <td className="px-2 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2 py-1 rounded-md ${demandTone[r.demand]}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {r.demand}
                          </span>
                        </td>
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
                <div className="text-[14px] font-bold text-slate-900 mb-4">Skills by Category</div>
                <AdminDonutChart data={d.donut} total={d.stats.total} />
                <button className="w-full mt-4 text-[12.5px] font-semibold text-blue-600">View all categories →</button>
              </div>
              <AdminTopList
                title="Top Skills by Jobs"
                items={d.top.map((t, i) => ({ ...t, rank: i + 1 }))}
                footerLabel="View all skills"
              />
              <AdminQuickTips tips={d.tips} />
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-2">© 2025 Energy Tail. All rights reserved.</div>
        </main>
      </div>
    </div>
  );
}