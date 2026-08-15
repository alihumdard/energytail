"use client";

import { useState } from "react";
import Link from "next/link";
import Shell from "@/components/admin/Shell";
import { Badge, PageHeader } from "@/components/admin/ShellUI";
import { jobDetail } from "@/data/adminMockData";
import {
  ArrowLeft,
  Pencil,
  ChevronDown,
  Eye,
  Share2,
  Copy,
  Briefcase,
  DollarSign,
  CalendarClock,
  BarChart3,
  Flame,
  MapPin,
  Clock,
  Hash,
  Building2,
  Users2,
  Globe,
  MapPinned,
  BadgeCheck,
  Plus,
  MessageCircle,
  Mail,
  Lock,
} from "lucide-react";

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

function XTwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05v-2.66c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.09 24 18.1 24 12.07z" />
    </svg>
  );
}

const tabs = [
  "Overview",
  "Description",
  "Requirements",
  "Benefits",
  "Company",
  "Analytics",
  "Activity Log",
];

export default function JobDetailsPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const job = jobDetail;

  return (
    <Shell>
      <PageHeader
        title="Job Details"
        breadcrumb={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Jobs", href: "/admin/jobs" },
          { label: job.title },
        ]}
        actions={
          <>
            <Link
              href="/admin/jobs"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={15} />
              Back to Jobs
            </Link>
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50">
              <Pencil size={15} />
              Edit Job
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand-700">
              Actions
              <ChevronDown size={14} />
            </button>
          </>
        }
      />

      {/* Job header card */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand-50">
            <Flame size={28} className="text-brand-600" fill="currentColor" strokeWidth={0} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[19px] font-bold text-gray-900">{job.title}</h2>
              <Badge color="green" dot>
                {job.status}
              </Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-500">
              <span className="flex items-center gap-1.5 font-medium text-gray-700">
                <Flame size={13} className="text-brand-500" />
                {job.company}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase size={13} />
                {job.type}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                Posted on {job.posted}
              </span>
              <span className="flex items-center gap-1.5">
                <Hash size={13} />
                Job ID: {job.id}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <InfoChip icon={BarChart3} label="Experience" value={job.experience} color="text-green-600 bg-green-50" />
              <InfoChip icon={DollarSign} label="Salary" value={job.salary} sub={job.salaryPeriod} color="text-purple-600 bg-purple-50" />
              <InfoChip icon={Briefcase} label="Job Type" value={job.type} color="text-blue-600 bg-blue-50" />
              <InfoChip
                icon={CalendarClock}
                label="Deadline"
                value={job.deadline}
                sub={job.deadlineNote}
                subColor="text-red-500"
                color="text-red-600 bg-red-50"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          <TextBtn icon={Eye} label="View Job" />
          <TextBtn icon={Share2} label="Share Job" />
          <TextBtn icon={Copy} label="Duplicate" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {/* Tabs */}
          <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white px-2 shadow-card">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 px-3.5 py-3 text-[13.5px] font-medium transition ${
                  activeTab === tab
                    ? "border-brand-600 text-brand-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
            <div className="space-y-5">
              <Panel title="Job Description">
                <p className="text-[13.5px] leading-relaxed text-gray-600">
                  {job.description}
                </p>
                <h4 className="mb-2 mt-5 text-[14px] font-semibold text-gray-900">
                  Key Responsibilities
                </h4>
                <ul className="space-y-2">
                  {job.responsibilities.map((r) => (
                    <li key={r} className="flex gap-2.5 text-[13.5px] text-gray-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Requirements">
                <ul className="space-y-2">
                  {job.requirements.map((r) => (
                    <li key={r} className="flex gap-2.5 text-[13.5px] text-gray-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>

            <div className="space-y-5">
              <Panel title="Company Information">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Flame size={16} fill="currentColor" strokeWidth={0} />
                  </span>
                  <div>
                    <p className="flex items-center gap-1 text-[13.5px] font-semibold text-gray-900">
                      {job.company}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-green-600">
                      <BadgeCheck size={12} />
                      Verified
                    </span>
                  </div>
                </div>
                <dl className="space-y-2.5 text-[13px]">
                  <MetaRow icon={Building2} label="Industry" value={job.companyInfo.industry} />
                  <MetaRow icon={Users2} label="Company Size" value={job.companyInfo.size} />
                  <MetaRow
                    icon={Globe}
                    label="Website"
                    value={
                      <span className="text-brand-600">{job.companyInfo.website}</span>
                    }
                  />
                  <MetaRow icon={MapPinned} label="Location" value={job.companyInfo.location} />
                </dl>
                <button className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50">
                  View Company Profile
                </button>
              </Panel>

              <Panel title="Job Tags / Skills">
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((t) => (
                    <Badge key={t} color="gray">
                      {t}
                    </Badge>
                  ))}
                  <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-[12px] font-medium text-gray-500 hover:bg-gray-50">
                    <Plus size={12} />
                    Add Tag
                  </button>
                </div>
              </Panel>

              <Panel title="Share this Job">
                <div className="flex flex-wrap gap-2">
                  <SocialBtn color="bg-[#0A66C2]"><LinkedInIcon /></SocialBtn>
                  <SocialBtn color="bg-[#1DA1F2]"><XTwitterIcon /></SocialBtn>
                  <SocialBtn color="bg-[#1877F2]"><FacebookIcon /></SocialBtn>
                  <SocialBtn color="bg-[#25D366]"><MessageCircle size={16} /></SocialBtn>
                  <SocialBtn color="bg-gray-500"><Mail size={16} /></SocialBtn>
                </div>
              </Panel>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <Panel title="Job Status">
            <dl className="space-y-3 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <Badge color="green">{job.status}</Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Visibility</dt>
                <dd>
                  <Badge color="blue">Public</Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Featured</dt>
                <dd>
                  <Badge color="green">Yes</Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Urgent</dt>
                <dd>
                  <Badge color="gray">No</Badge>
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Job Performance">
            <dl className="space-y-3 text-[13px]">
              <PerfRow icon={Eye} label="Total Views" value={job.performance.totalViews} />
              <PerfRow icon={BarChart3} label="Apply Clicks" value={job.performance.applyClicks} />
              <PerfRow icon={Briefcase} label="Applications (External)" value={job.performance.applicationsExternal} />
              <PerfRow
                icon={CalendarClock}
                label="Views This Week"
                value={job.performance.viewsThisWeek}
                change={job.performance.viewsThisWeekChange}
              />
              <PerfRow
                icon={CalendarClock}
                label="Apply Clicks This Week"
                value={job.performance.applyClicksThisWeek}
                change={job.performance.applyClicksThisWeekChange}
              />
            </dl>
          </Panel>

          <Panel title="Important Dates">
            <dl className="space-y-3 text-[13px]">
              <div className="flex items-start justify-between">
                <dt className="flex items-center gap-1.5 text-gray-500">
                  <CalendarClock size={13} />
                  Posted Date
                </dt>
                <dd className="text-right font-medium text-gray-800">{job.dates.posted}</dd>
              </div>
              <div className="flex items-start justify-between">
                <dt className="flex items-center gap-1.5 text-gray-500">
                  <CalendarClock size={13} />
                  Deadline
                </dt>
                <dd className="text-right">
                  <p className="font-medium text-gray-800">{job.dates.deadline}</p>
                  <p className="text-[11px] text-red-500">{job.dates.deadlineNote}</p>
                </dd>
              </div>
              <div className="flex items-start justify-between">
                <dt className="flex items-center gap-1.5 text-gray-500">
                  <CalendarClock size={13} />
                  Last Date to Apply
                </dt>
                <dd className="text-right font-medium text-gray-800">{job.dates.lastDateToApply}</dd>
              </div>
              <div className="flex items-start justify-between">
                <dt className="flex items-center gap-1.5 text-gray-500">
                  <CalendarClock size={13} />
                  Last Updated
                </dt>
                <dd className="text-right font-medium text-gray-800">{job.dates.lastUpdated}</dd>
              </div>
            </dl>
          </Panel>

          <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-[13.5px] font-medium text-red-600 hover:bg-red-50">
            <Lock size={14} />
            Close This Job
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
      <h3 className="mb-3.5 text-[14.5px] font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
  sub,
  subColor = "text-gray-400",
  color,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-gray-100 p-2.5">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${color}`}>
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11.5px] text-gray-400">{label}</p>
        <p className="truncate text-[12.5px] font-semibold text-gray-800">{value}</p>
        {sub && <p className={`truncate text-[11px] ${subColor}`}>{sub}</p>}
      </div>
    </div>
  );
}

function TextBtn({ icon: Icon, label }: { icon: typeof Eye; label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] font-medium text-gray-600 hover:bg-gray-50">
      <Icon size={13} />
      {label}
    </button>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-gray-400">
        <Icon size={13} />
        {label}
      </span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

function PerfRow({
  icon: Icon,
  label,
  value,
  change,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  change?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-gray-500">
        <Icon size={13} />
        {label}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-semibold text-gray-800">{value}</span>
        {change && (
          <span className="text-[11px] font-medium text-green-600">↑ {change}</span>
        )}
      </span>
    </div>
  );
}

function SocialBtn({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <button
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${color} hover:opacity-90`}
    >
      {children}
    </button>
  );
}
