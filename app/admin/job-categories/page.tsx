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
import { LayoutGrid, ShieldCheck, Tag } from "lucide-react";
import { jobCategories as d } from "@/lib/admin-data";

export const metadata = { title: "Job Categories · Energy Tail Admin" };

export default function JobCategoriesPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar active="categories" />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar variant="dark" />

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          <AdminPageHeader crumbs={["Dashboard", "Job Categories"]} title="Job Categories" addLabel="Add New Category" />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <AdminStatCard icon={LayoutGrid} tone="blue" label="Total Categories" value={d.stats.total} hint="All job categories" />
            <AdminStatCard icon={ShieldCheck} tone="green" label="Active Categories" value={d.stats.active} hint="Currently active" />
            <AdminStatCard icon={LayoutGrid} tone="orange" label="Inactive Categories" value={d.stats.inactive} hint="Currently inactive" />
            <AdminStatCard icon={Tag} tone="purple" label="Total Jobs" value={d.stats.jobs.toLocaleString()} hint="Under all categories" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="min-w-0 bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <AdminToolbar searchPlaceholder="Search categories..." />
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-t border-b border-slate-100 text-[12px] font-semibold text-slate-400 uppercase tracking-wide">
                      <th className="px-5 py-3 w-8"><input type="checkbox" /></th>
                      <th className="px-2 py-3">Category Name</th>
                      <th className="px-2 py-3">Slug</th>
                      <th className="px-2 py-3">Jobs Count</th>
                      <th className="px-2 py-3">Status</th>
                      <th className="px-2 py-3">Order</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.rows.map((r) => (
                      <tr key={r.slug} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3.5"><input type="checkbox" /></td>
                        <td className="px-2 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                              style={{ background: r.color + "1a" }}
                            >
                              {r.emoji}
                            </div>
                            <div>
                              <div className="text-[13.5px] font-semibold text-slate-800">{r.name}</div>
                              <div className="text-[12px] text-slate-400">{r.desc}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3.5 text-[13px] text-slate-500">{r.slug}</td>
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
                <div className="text-[14px] font-bold text-slate-900 mb-4">Category Overview</div>
                <AdminDonutChart data={d.donut} total={d.stats.total} />
              </div>
              <AdminTopList title="Top Categories by Jobs" items={d.top} footerLabel="View all categories" />
              <AdminQuickTips tips={d.tips} />
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-2">© 2025 Energy Tail. All rights reserved.</div>
        </main>
      </div>
    </div>
  );
}