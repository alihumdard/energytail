"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/admin/DashboardLayout";
import { Breadcrumb } from "@/components/admin/DashboardUI";
import { companies } from "@/data/mockData";
import {
  ArrowLeft,
  Pencil,
  ChevronDown,
  Share2,
  AtSign,
  MessageCircle,
  Link2,
  Briefcase,
  Calendar,
  Users,
  MapPin,
  Globe,
  Building,
  Mail,
  Phone,
  CheckCircle2,
  Eye,
  MousePointerClick,
  UserPlus,
  ImageIcon,
} from "lucide-react";

const tabs = [
  "Overview",
  "Contact & Social",
  "Company Culture",
  "Jobs",
  "Analytics",
  "Billing & Subscriptions",
  "Notes & Activity",
];

export default function CompanyDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const company = companies.find((c) => c.id === id) ?? companies[0];
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Details</h1>
          <div className="mt-1">
            <Breadcrumb
              items={[
                { label: "Dashboard", href: "/admin/dashboard" },
                { label: "Companies", href: "/admin/companies" },
                { label: company.name },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-50">
            <ArrowLeft size={16} />
            Back to Companies
          </button>
          <button className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 rounded-lg px-4 py-2.5 hover:bg-blue-100">
            <Pencil size={15} />
            Edit Company
          </button>
          <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm">
            Actions
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-8">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0 border border-gray-100 ${company.logoColor}`}>
              {company.logo}
            </div>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {company.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Building size={14} /> {company.industry}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {company.location}
                </span>
                <span className="flex items-center gap-1.5 text-blue-600">
                  <Globe size={14} /> www.{company.name.toLowerCase().replace(/\s+/g, "")}.com
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-3 max-w-2xl">
                {company.name} is a global leader in providing innovative energy solutions.
                We specialize in exploration, drilling, production, and energy management
                with a commitment to safety and sustainability.
              </p>
              <div className="flex items-center gap-2 mt-4">
                {[Share2, AtSign, MessageCircle, Link2].map((Icon, i) => (
                  <button
                    key={i}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:w-72 shrink-0 grid grid-cols-1 gap-y-3 text-sm lg:border-l lg:border-gray-100 lg:pl-6">
            <InfoRow icon={Building} label="Company ID" value={company.id} />
            <InfoRow icon={Mail} label="Email" value={company.email} />
            <InfoRow icon={Phone} label="Phone" value="+1 (713) 555-0198" />
            <InfoRow icon={Users} label="Company Size" value="201 – 500 employees" />
            <InfoRow icon={Calendar} label="Joined Date" value={company.joinedDate} />
            <InfoRow icon={Calendar} label="Last Updated" value={`${company.joinedDate} 10:30 AM`} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px flex items-center gap-1.5 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
            {tab === "Jobs" && (
              <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5">
                {company.jobs}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab !== "Overview" ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 shadow-sm">
          {tabs.includes(activeTab) ? `${activeTab} content goes here.` : ""}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6 min-w-0">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">About Company</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {company.name} delivers end-to-end energy services across the globe. Our
                expertise spans upstream, midstream, and downstream operations. We leverage
                advanced technology and a highly skilled workforce to provide safe, efficient,
                and sustainable energy solutions.
              </p>
              <div className="grid grid-cols-2 gap-y-5 mt-6">
                <DetailItem icon={Building} label="Industry" value={company.industry} />
                <DetailItem icon={Calendar} label="Founded" value="2012" />
                <DetailItem icon={Users} label="Company Size" value="201 – 500 employees" />
                <DetailItem icon={MapPin} label="Headquarters" value={company.location} />
                <DetailItem
                  icon={Globe}
                  label="Website"
                  value={`www.${company.name.toLowerCase().replace(/\s+/g, "")}.com`}
                  link
                />
                <DetailItem icon={Briefcase} label="Company Type" value="Private" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Company Cover</h3>
                <button className="text-gray-400 hover:text-blue-600">
                  <Pencil size={15} />
                </button>
              </div>
              <div className="rounded-lg overflow-hidden aspect-[16/6] bg-gradient-to-br from-slate-700 via-slate-800 to-black flex items-center justify-center">
                <ImageIcon className="text-white/30" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Company Logo</h3>
                <button className="text-gray-400 hover:text-blue-600">
                  <Pencil size={15} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl ${company.logoColor}`}>
                  {company.logo}
                </div>
                <div>
                  <p className="font-bold text-gray-900 leading-tight">
                    {company.name.split(" ")[0].toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400 tracking-widest">
                    {company.name.split(" ").slice(1).join(" ").toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Company Highlights</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <HighlightCard
                  icon={Briefcase}
                  iconBg="bg-blue-50"
                  iconColor="text-blue-600"
                  label="Total Jobs"
                  value={company.jobs}
                  linkLabel="View all jobs"
                />
                <HighlightCard
                  icon={Eye}
                  iconBg="bg-green-50"
                  iconColor="text-green-600"
                  label="Total Views"
                  value="12,548"
                  linkLabel="All time views"
                  noArrow
                />
                <HighlightCard
                  icon={MousePointerClick}
                  iconBg="bg-orange-50"
                  iconColor="text-orange-500"
                  label="Apply Clicks"
                  value="1,298"
                  linkLabel="All time clicks"
                  noArrow
                />
                <HighlightCard
                  icon={UserPlus}
                  iconBg="bg-purple-50"
                  iconColor="text-purple-600"
                  label="Followers"
                  value="356"
                  linkLabel="Company followers"
                  noArrow
                />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Status &amp; Verification</h3>
              <div className="space-y-3.5 text-sm">
                <StatusRow label="Status" value="Active" ok />
                <StatusRow label="Email Verified" value="Verified" ok />
                <StatusRow label="Company Verified" value="Verified" ok />
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-gray-500">Profile Completion</span>
                    <span className="font-semibold text-gray-900">100%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500">Admin Notes</span>
                    <button className="text-gray-400 hover:text-blue-600">
                      <Pencil size={14} />
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm">No notes added.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <ActivityRow
                  icon={Briefcase}
                  iconBg="bg-green-50"
                  iconColor="text-green-600"
                  title="New job posted"
                  detail="Drilling Operations Manager"
                  time="May 18, 2025 09:15 AM"
                  link
                />
                <ActivityRow
                  icon={Eye}
                  iconBg="bg-blue-50"
                  iconColor="text-blue-600"
                  title="Profile updated"
                  detail="Company information updated"
                  time="May 18, 2025 08:45 AM"
                />
                <ActivityRow
                  icon={UserPlus}
                  iconBg="bg-orange-50"
                  iconColor="text-orange-500"
                  title="Subscription renewed"
                  detail="Premium Plan – Monthly"
                  time="May 18, 2025 08:30 AM"
                />
              </div>
              <button className="w-full mt-4 text-sm font-medium text-blue-600 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50">
                View all activity
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={15} className="text-gray-400 shrink-0" />
      <span className="text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-gray-700 font-medium truncate">{value}</span>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  link?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={16} className="text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm font-medium mt-0.5 ${link ? "text-blue-600" : "text-gray-800"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function HighlightCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  linkLabel,
  noArrow,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  linkLabel: string;
  noArrow?: boolean;
}) {
  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${iconBg}`}>
        <Icon size={17} className={iconColor} />
      </div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
      <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
        {linkLabel}
        {!noArrow && <span>→</span>}
      </p>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
          ok ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
        }`}
      >
        {ok && <CheckCircle2 size={12} />}
        {value}
      </span>
    </div>
  );
}

function ActivityRow({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  detail,
  time,
  link,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  detail: string;
  time: string;
  link?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={15} className={iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className={`text-xs mt-0.5 ${link ? "text-blue-600" : "text-gray-400"}`}>{detail}</p>
        <p className="text-xs text-gray-300 mt-0.5">{time}</p>
      </div>
    </div>
  );
}
