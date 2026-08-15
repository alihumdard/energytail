"use client";

import { useState } from "react";
import { Logo, Avatar } from "@/components/Shared";
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  CircleCheck,
  CreditCard,
  ExternalLink,
  FileText,
  Flame,
  Gauge,
  Globe,
  Grid2X2,
  Home,
  Info,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  MoreVertical,
  Phone,
  Search,
  Settings,
  Star,
  Users,
  X,
  Link2,
  ChevronRight,
} from "lucide-react";

const sideNav = [
  { label: "Dashboard", icon: Home, href: "/employer-dashboard" },
  { label: "My Jobs", icon: Briefcase, href: "/admin/jobs" },
  { label: "Applicants", icon: Users, href: "/admin/jobs" },
  { label: "Resumes", icon: FileText, href: "/jobs" },
  { label: "Company Profile", icon: Building2, href: "/employer/company-profile", active: true },
  { label: "Billing & Plans", icon: CreditCard, href: "/admin/settings" },
  { label: "Messages", icon: Mail, href: "/login", badge: 3 },
  { label: "Saved Candidates", icon: Star, href: "/jobs" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

const steps = [
  { label: "Basic Information", icon: Home, active: true },
  { label: "Company Details", icon: Grid2X2 },
  { label: "Company Culture", icon: Users },
  { label: "Social Links", icon: Link2 },
  { label: "Review & Publish", icon: CircleCheck },
];

function SidebarContent() {
  return (
    <>
      <div className="flex h-[74px] items-center border-b border-[#eef2f7] px-5">
        <Logo />
      </div>

      <div className="mx-4 mt-4 rounded-xl border border-[#e2eaf6] bg-[#f7faff] p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-white">
            <Flame className="h-6 w-6 fill-brand-500 text-brand-500" strokeWidth={1} />
          </span>
          <div>
            <p className="text-[13px] font-bold">Energy Tail Ltd.</p>
            <span className="chip mt-1.5 bg-brand-100 text-brand-600">Employer</span>
          </div>
        </div>
        <a
          href="/companies"
          className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-brand-500"
        >
          View Company Page <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3">
        {sideNav.map(({ label, icon: Icon, active, badge, href }) => (
          <a
            key={label}
            href={href}
            className={`nav-item ${active ? "nav-item-active" : ""}`}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="chip bg-brand-100 px-2 text-brand-600">{badge}</span>
            )}
          </a>
        ))}
      </nav>

      <div className="m-3 rounded-xl bg-[#f4f7fd] p-4">
        <p className="text-[12.5px] font-bold">Complete your company profile</p>
        <p className="mt-2 text-[11.5px] text-ink-500">85% Completed</p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-[#dde6f3]">
          <div className="h-full w-[85%] rounded-full bg-emerald-500" />
        </div>
        <a
          href="/companies"
          className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-brand-500"
        >
          Preview Company Page <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="border-t border-[#eef2f7] p-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-[#eef2f7] p-2.5">
          <Avatar size={36} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[12.5px] font-bold">John Smith</span>
            <span className="block truncate text-[11px] text-ink-500">john@energytail.com</span>
          </span>
          <MoreVertical className="h-4 w-4 shrink-0 text-ink-500" />
        </div>
        <a
          href="/login"
          className="mt-2 flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold text-ink-700 hover:text-brand-500"
        >
          <LogOut className="h-[18px] w-[18px]" /> Log Out
        </a>
      </div>
    </>
  );
}

export default function CompanyProfilePage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] flex-col border-r border-[#e8edf5] bg-white lg:flex">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-white">
            <button
              className="absolute right-4 top-6 text-ink-500"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="lg:pl-[268px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[74px] items-center gap-4 border-b border-[#e8edf5] bg-white px-4 sm:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu className="h-6 w-6" />
          </button>

          <div className="relative w-full max-w-[600px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              className="h-11 w-full rounded-xl border border-[#e2e8f2] bg-[#f8fafc] pl-11 pr-16 text-[13px] outline-none focus:border-brand-500"
              placeholder="Search for jobs, candidates, companies..."
            />
            <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[#e2e8f2] bg-white px-2 py-1 text-[10.5px] font-semibold text-ink-500 sm:block">
              Ctrl + K
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <button className="hidden text-ink-500 hover:text-brand-500 sm:block">
              <MessageSquare className="h-[21px] w-[21px]" />
            </button>
            <button className="relative text-ink-500 hover:text-brand-500">
              <Bell className="h-[21px] w-[21px]" />
              <span className="absolute -right-1.5 -top-1.5 grid h-[17px] w-[17px] place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                5
              </span>
            </button>
            <div className="flex items-center gap-2.5">
              <Flame className="h-7 w-7 fill-brand-500 text-brand-500" strokeWidth={1} />
              <span className="hidden text-[13px] font-bold sm:block">Energy Tail Ltd.</span>
              <ChevronDown className="h-4 w-4 text-ink-500" />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1320px] px-4 py-7 sm:px-6 lg:px-8">
          {/* Page head */}
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start">
            <div>
              <h1 className="text-[26px] font-extrabold tracking-tight">Company Profile</h1>
              <nav className="mt-2 flex items-center gap-2 text-[12.5px] text-ink-500">
                <span>Dashboard</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-ink-700">Company Profile</span>
              </nav>
              <p className="mt-2.5 text-[13px] text-ink-500">
                Manage your company information and how it appears to job seekers.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 xl:ml-auto">
              <button className="btn-ghost">
                Preview Company Page <ExternalLink className="h-4 w-4" />
              </button>
              <button className="btn-primary px-6">Save Changes</button>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
            {/* Steps + strength */}
            <div className="space-y-5">
              <nav className="card p-3">
                {steps.map(({ label, icon: Icon, active }) => (
                  <button
                    key={label}
                    className={`nav-item w-full ${active ? "nav-item-active" : ""}`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {label}
                  </button>
                ))}
              </nav>

              <section className="card p-5">
                <h3 className="text-[14.5px] font-bold">Profile Strength</h3>
                <p className="mt-3 text-[12px] font-semibold text-ink-500">85% Completed</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[#e6edf7]">
                  <div className="h-full w-[85%] rounded-full bg-emerald-500" />
                </div>

                <ul className="mt-5 space-y-3.5">
                  {steps.map((s, i) => (
                    <li key={s.label} className="flex items-center gap-2.5 text-[12.5px]">
                      {i < 4 ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 fill-emerald-500 text-white" />
                      ) : (
                        <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#dbe4f2]" />
                      )}
                      <span className={i < 4 ? "text-ink-700" : "text-ink-500"}>{s.label}</span>
                      {i < 4 ? (
                        <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
                      ) : (
                        <span className="ml-auto h-4 w-4 rounded-full border-2 border-[#dbe4f2]" />
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-lg bg-[#f4f7fd] p-3.5 text-[11.5px] leading-relaxed text-ink-500">
                  <b className="text-ink-900">Tip:</b> A complete profile gets more visibility and
                  attracts better candidates.
                </div>
              </section>
            </div>

            {/* Form */}
            <section className="card p-5 sm:p-6">
              <h2 className="text-[17px] font-extrabold">Basic Information</h2>
              <p className="mt-1.5 text-[12.5px] text-ink-500">
                Add your company&apos;s basic information. This will be shown on your company
                profile.
              </p>

              <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div>
                  <p className="label flex items-center gap-1.5">
                    Company Logo <Info className="h-3.5 w-3.5 text-ink-500" />
                  </p>
                  <div className="relative grid h-[150px] w-full place-items-center rounded-xl border border-[#e2e8f2] bg-white sm:w-[150px]">
                    <Flame className="h-14 w-14 fill-brand-500 text-brand-500" strokeWidth={0.8} />
                    <button className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-lg border border-[#e2e8f2] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-700 shadow-sm">
                      <Camera className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-500">
                    Recommended: 300x300px, PNG or JPG
                  </p>
                </div>

                <div>
                  <p className="label flex items-center gap-1.5">
                    Cover Image <Info className="h-3.5 w-3.5 text-ink-500" />
                  </p>
                  <div className="ph ph-rig-night relative h-[150px] rounded-xl">
                    <button className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-[11.5px] font-semibold text-ink-700 shadow-sm">
                      <Camera className="h-3.5 w-3.5" /> Change Image
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-500">
                    Recommended: 1200x400px, JPG or PNG
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-5 lg:grid-cols-2">
                <div>
                  <label className="label req">Company Name</label>
                  <input className="input" defaultValue="Energy Tail Ltd." />
                </div>
                <div>
                  <label className="label req">Tagline / Short Description</label>
                  <input className="input" defaultValue="Connecting Talent. Powering Energy." />
                </div>
                <div>
                  <label className="label req">Industry</label>
                  <select className="select" defaultValue="Oil, Gas & Energy">
                    <option>Oil, Gas &amp; Energy</option>
                    <option>Renewable Energy</option>
                    <option>Petrochemical</option>
                  </select>
                </div>
                <div>
                  <label className="label req">Company Size</label>
                  <select className="select" defaultValue="51 – 200 employees">
                    <option>51 – 200 employees</option>
                    <option>1 – 50 employees</option>
                    <option>201 – 1000 employees</option>
                  </select>
                </div>
                <div>
                  <label className="label">Founded Year</label>
                  <div className="relative">
                    <input className="input pr-10" defaultValue="2015" />
                    <Calendar className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                  </div>
                </div>
                <div>
                  <label className="label">Website</label>
                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                    <input className="input pl-10" defaultValue="https://www.energytail.com" />
                  </div>
                </div>
                <div>
                  <label className="label req">Company Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                    <input className="input pl-10" defaultValue="info@energytail.com" />
                  </div>
                </div>
                <div>
                  <label className="label req">Phone Number</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                    <input className="input pl-10" defaultValue="+1 (346) 555-0198" />
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className="label req">Company Overview</label>
                <div className="relative">
                  <textarea
                    className="input h-[112px] resize-none py-3 leading-relaxed"
                    defaultValue="Energy Tail Ltd. is a global energy solutions company committed to delivering innovative and sustainable solutions in the oil, gas and energy sector. We connect talented professionals with leading companies worldwide."
                  />
                  <span className="absolute bottom-2.5 right-3.5 text-[11px] text-ink-500">
                    158/500
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end border-t border-[#eef2f7] pt-5">
                <button className="btn-primary px-7">Save Changes</button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}