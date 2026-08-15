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
import { Tag, ShieldCheck, Briefcase, Layers } from "lucide-react";
import { tags as d } from "@/lib/admin-data";

export const metadata = { title: "Tags · Energy Tail Admin" };

export default function TagsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar active="tags" />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar variant="dark" />

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          <AdminPageHeader crumbs={["Dashboard", "Tags"]} title="Tags" addLabel="Add New Tag" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <AdminStatCard icon={Tag} tone="blue" label="Total Tags" value={d.stats.total} hint="All tags in system" />
            <AdminStatCard icon={ShieldCheck} tone="green" label="Active Tags" value={d.stats.active} hint="Currently active" />
            <AdminStatCard icon={Tag} tone="orange" label="Inactive Tags" value={d.stats.inactive} hint="Currently inactive" />
            <AdminStatCard icon={Briefcase} tone="purple" label="Tags in Use" value={d.stats.inUse} hint="Used in jobs/articles" />
            <AdminStatCard icon={Layers} tone="blue" label="Total Assignments" value={d.stats.assignments.toLocaleString()} hint="Across all content" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="min-w-0 bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <AdminToolbar searchPlaceholder="Search tags..." />
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-t border-b border-slate-100 text-[12px] font-semibold text-slate-400 uppercase tracking-wide">
                      <th className="px-5 py-3 w-8"><input type="checkbox" /></th>
                      <th className="px-2 py-3">Tag Name</th>
                      <th className="px-2 py-3">Slug</th>
                      <th className="px-2 py-3">Usage</th>
                      <th className="px-2 py-3">Status</th>
                      <th className="px-2 py-3">Created On</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.rows.map((r) => (
                      <tr key={r.slug} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3.5"><input type="checkbox" /></td>
                        <td className="px-2 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: r.color + "1a", color: r.color }}
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[13.5px] font-semibold text-slate-800">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3.5 text-[13px] text-slate-500">{r.slug}</td>
                        <td className="px-2 py-3.5 text-[13.5px] font-semibold text-blue-600">{r.usage.toLocaleString()}</td>
                        <td className="px-2 py-3.5"><AdminStatusBadge active={r.active} /></td>
                        <td className="px-2 py-3.5 text-[13px] text-slate-500">{r.created}</td>
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
                <div className="text-[14px] font-bold text-slate-900 mb-4">Tags by Usage</div>
                <AdminDonutChart data={d.donut} total={d.stats.total} />
              </div>
              <AdminTopList title="Top Tags by Usage" items={d.top} footerLabel="View all tags" />
              <AdminQuickTips tips={d.tips} />
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-2">© 2025 Energy Tail. All rights reserved.</div>
        </main>
      </div>
    </div>
  );
}