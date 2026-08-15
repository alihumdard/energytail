"use client";

import AdminShell from "@/components/AdminShell";
import { Facebook, Linkedin, Twitter } from "@/components/Shared";
import {
  AlignLeft,
  Bold,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Image as ImageIcon,
  Indent,
  Italic,
  Link2,
  List,
  ListOrdered,
  Info,
  MapPin,
  Pencil,
  Plus,
  Square,
  SquareStack,
  Trash2,
  Underline,
  Upload,
  UploadCloud,
  Users,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

const positions = [
  { n: "01", title: "NDT FITTER / NDT", ur: "ٹیسٹر", exp: "2-5 Years", pay: "1200-1800" },
  { n: "02", title: "RIGGER /", ur: "رگر", exp: "2-5 Years", pay: "1200-1800" },
  { n: "03", title: "SCAFFOLDER /", ur: "سکیفولڈر", exp: "2-5 Years", pay: "1200-1800" },
  { n: "04", title: "PIPE FABRICATOR /", ur: "پائپ فیبریکیٹر", exp: "3-6 Years", pay: "1500-2000" },
  { n: "05", title: "WELDER (6G TIG & ARC)", ur: "ویلڈر", exp: "2-5 Years", pay: "1200-1800" },
];

const requirements = [
  "Relevant experience in Oil & Gas / Industrial Projects",
  "Diploma / Trade Test Certificate (Relevant Field)",
  "Original Documents with CV",
  "Medical Fitness Certificate",
];

function LocationCard({ city, dark, date, address }) {
  return (
    <div className="rounded-xl border border-[#e8edf5] bg-white p-3">
      <div className="mb-4 flex items-start gap-2">
        <div
          className={`flex h-[46px] flex-1 items-center gap-2.5 rounded-lg px-3 text-[14px] font-extrabold tracking-wide text-white ${
            dark
              ? "bg-[#1b1b1f]"
              : "bg-gradient-to-r from-[#7b2ff7] via-[#a4269b] to-[#5b1e9c]"
          }`}
        >
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[#f59e0b]">
            <MapPin className="h-3.5 w-3.5 text-white" />
          </span>
          {city}
        </div>
        <button className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-lg border border-[#fee2e2] bg-[#fef2f2] text-red-500 hover:bg-red-50">
          <Trash2 className="h-[17px] w-[17px]" />
        </button>
      </div>

      <label className="label req">Walk-In Date</label>
      <div className="relative mb-4">
        <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input className="input pl-10" defaultValue={date} />
      </div>

      <label className="label req">Venue / Address</label>
      <textarea className="input h-[74px] resize-none py-2.5 leading-relaxed" defaultValue={address} />
    </div>
  );
}

export default function JobDetailsPage() {
  return (
    <AdminShell>
      {/* Page head */}
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center">
        <nav className="flex items-center gap-2 text-[13px] font-semibold text-ink-500">
          <span>Dashboard</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Jobs</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink-900">Job Details</span>
        </nav>

        <div className="flex flex-wrap gap-3 xl:ml-auto">
          <button className="btn-ghost text-brand-500">
            View Public Page <ExternalLink className="h-4 w-4" />
          </button>
          <button className="btn-ghost">
            <Copy className="h-4 w-4" /> Duplicate
          </button>
          <button className="btn-primary px-6">Save Changes</button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* ------------------------------------------------ LEFT COLUMN */}
        <div className="space-y-5">
          {/* Banner */}
          <section className="card p-5">
            <h3 className="mb-4 text-[15px] font-bold">
              Job Banner / Image{" "}
              <span className="text-[12px] font-medium text-ink-500">
                (Recommended size: 1200x628px)
              </span>
            </h3>
            <div className="grid place-items-center rounded-xl border-2 border-dashed border-[#dbe4f2] bg-[#fbfcfe] px-4 py-12 text-center">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-full border-2 border-dashed border-[#c7d5ea]">
                <UploadCloud className="h-5 w-5 text-brand-500" />
              </span>
              <p className="text-[14px] font-bold">Click to upload image</p>
              <p className="mt-1 text-[12px] text-ink-500">PNG, JPG or WEBP (Max 5MB)</p>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-500">
              <Info className="h-3.5 w-3.5" />
              This image will be shown on the job details page and in job listings as thumbnail.
            </p>
          </section>

          {/* Basic info */}
          <section className="card p-5">
            <h3 className="sect-title">Basic Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label req">Job Title</label>
                <input className="input" defaultValue="Walk-In Job Interviews for Saudi Arabia" />
              </div>
              <div>
                <label className="label req">Job Position / Role</label>
                <input className="input" defaultValue="Various Positions" />
              </div>
              <div>
                <label className="label req">Employment Type</label>
                <select className="select" defaultValue="Full-time">
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </div>
              <div>
                <label className="label req">Experience Level</label>
                <select className="select" defaultValue="2 - 10 Years">
                  <option>2 - 10 Years</option>
                  <option>0 - 2 Years</option>
                  <option>10+ Years</option>
                </select>
              </div>
              <div>
                <label className="label req">Department / Category</label>
                <select className="select" defaultValue="Operations">
                  <option>Operations</option>
                  <option>Engineering</option>
                  <option>HSE</option>
                </select>
              </div>
              <div>
                <label className="label req">Job Category</label>
                <select className="select" defaultValue="Field Operations">
                  <option>Field Operations</option>
                  <option>Maintenance</option>
                  <option>Drilling</option>
                </select>
              </div>
            </div>
          </section>

          {/* Walk-in locations */}
          <section className="card p-5">
            <h3 className="mb-1 text-[15px] font-bold text-brand-500">
              Walk-In Locations{" "}
              <span className="text-[12.5px] text-ink-700">(Multiple Locations)</span>
            </h3>
            <p className="mb-4 text-[12.5px] text-ink-500">
              Add one or more walk-in interview locations
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <LocationCard
                city="ISLAMABAD"
                date="07-AUGUST-2026"
                address="G-7/1 Building No. 23 Street No. 31"
              />
              <LocationCard
                city="SADIQABAD"
                dark
                date="13-AUGUST-2026"
                address="Midway Hotel, Main G.T. Road,"
              />
            </div>

            <button className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg border border-[#dbe4f2] bg-white px-4 text-[13px] font-semibold text-brand-500 hover:bg-brand-50">
              <Plus className="h-4 w-4" /> Add Another Location
            </button>
          </section>

          {/* Positions */}
          <section className="card p-5">
            <h3 className="mb-1 text-[15px] font-bold text-brand-500">Positions / Vacancies</h3>
            <p className="mb-4 text-[12.5px] text-ink-500">
              Add all positions with required experience and salary range
            </p>

            <div className="overflow-x-auto rounded-xl border border-[#e8edf5]">
              <table className="w-full min-w-[640px] border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-[#f8fafc] text-left text-[12px] font-bold text-ink-700">
                    <th className="w-12 px-4 py-3">#</th>
                    <th className="px-4 py-3">Position / Job Title</th>
                    <th className="w-28 px-4 py-3">Experience</th>
                    <th className="w-40 px-4 py-3">Salary Range (PKR)</th>
                    <th className="w-24 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr key={p.n} className="border-t border-[#eef2f7]">
                      <td className="px-4 py-2.5 font-semibold text-ink-500">{p.n}</td>
                      <td className="px-4 py-2.5">
                        <input
                          className="h-9 w-full rounded-md border border-transparent bg-transparent px-1 font-semibold outline-none hover:border-[#e2e8f2] focus:border-brand-500"
                          defaultValue={`${p.title} ${p.ur}`}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-ink-700">{p.exp}</td>
                      <td className="px-4 py-2.5">
                        <input
                          className="h-9 w-full rounded-md border border-[#e2e8f2] px-2.5 text-[12.5px] outline-none focus:border-brand-500"
                          defaultValue={p.pay}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <button className="text-brand-500 hover:text-brand-600">
                            <Pencil className="h-[15px] w-[15px]" />
                          </button>
                          <button className="text-red-500 hover:text-red-600">
                            <Trash2 className="h-[15px] w-[15px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg border border-[#dbe4f2] bg-white px-4 text-[13px] font-semibold text-brand-500 hover:bg-brand-50">
              <Plus className="h-4 w-4" /> Add More Position
            </button>
          </section>

          {/* Description */}
          <section className="card p-5">
            <h3 className="sect-title">Job Description</h3>
            <div className="overflow-hidden rounded-xl border border-[#e2e8f2]">
              <div className="flex flex-wrap items-center gap-1 border-b border-[#e2e8f2] bg-[#f8fafc] px-3 py-2 text-ink-700">
                {[Bold, Italic, Underline, List, ListOrdered, SquareStack, AlignLeft, Indent, Link2, ImageIcon].map(
                  (Icon, i) => (
                    <button
                      key={i}
                      className="grid h-8 w-8 place-items-center rounded-md hover:bg-white hover:text-brand-500"
                    >
                      <Icon className="h-[15px] w-[15px]" />
                    </button>
                  )
                )}
              </div>
              <div className="space-y-3 p-4 text-[13px] leading-relaxed text-ink-700">
                <p>
                  Trans Arabian Employment Company is conducting Walk-In Job Interviews for our
                  leading client in <b className="text-ink-900">Saudi Arabia</b> for various
                  positions in Oil &amp; Gas Industry.
                </p>
                <p>
                  Candidates must have relevant experience in Oil &amp; Gas / Industrial Projects.
                  Attractive salary package with other benefits as per company policy.
                </p>
                <p>
                  Interested candidates are requested to attend the walk-in interview on the given
                  dates along with required documents.
                </p>
              </div>
            </div>
          </section>

          {/* Requirements */}
          <section className="card p-5">
            <h3 className="sect-title">Requirements</h3>
            <ul className="space-y-2.5">
              {requirements.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px] text-ink-700">
                  <CheckCircle2 className="mt-px h-4 w-4 shrink-0 fill-brand-500 text-white" />
                  {r}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-4 border-t border-[#eef2f7] pt-5 sm:flex-row sm:items-center">
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold text-ink-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#cbd5e1] text-brand-500 focus:ring-brand-500"
                />
                Mark as Featured Job
              </label>
              <div className="flex gap-3 sm:ml-auto">
                <button className="btn-ghost px-7">Cancel</button>
                <button className="btn-primary px-7">Save Changes</button>
              </div>
            </div>
          </section>
        </div>

        {/* ----------------------------------------------- RIGHT COLUMN */}
        <aside className="space-y-5">
          <section className="card p-5">
            <h3 className="text-[15px] font-bold">Job Preview</h3>
            <p className="mb-4 mt-1 text-[12px] leading-relaxed text-ink-500">
              This is how the job will appear to job seekers.
            </p>

            <div className="ph relative mb-4 grid h-[130px] place-items-center rounded-lg bg-[#e9edf3]">
              <ImageIcon className="h-7 w-7 text-[#b6c2d4]" />
              <span className="chip absolute bottom-2.5 right-2.5 bg-brand-100 text-brand-600">
                Full-time
              </span>
            </div>

            <h4 className="text-[17px] font-extrabold leading-snug">
              Walk-In Job Interviews for Saudi Arabia
            </h4>

            <div className="mt-3.5 space-y-3 text-[12.5px] text-ink-700">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ink-500" /> Islamabad · Sadiqabad
              </p>
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4 text-ink-500" /> Various Positions
              </p>
              <p className="flex items-center gap-2 font-semibold">
                <Briefcase className="h-4 w-4 text-ink-500" /> Full-time
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-ink-500" /> 2 - 10 Years
              </p>
              <p className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-ink-500" /> Trans Arabian Employment Company
              </p>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="mb-4 text-[15px] font-bold">Job Summary</h3>
            <div className="space-y-4 text-[12.5px]">
              {[
                { icon: Briefcase, k: "Employment Type", v: "Full-time" },
                { icon: Clock, k: "Experience Level", v: "2 - 10 Years" },
                { icon: SquareStack, k: "Department", v: "Operations" },
                { icon: Link2, k: "Job Category", v: "Field Operations" },
              ].map(({ icon: Icon, k, v }) => (
                <div key={k} className="flex gap-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
                  <div>
                    <p className="text-ink-500">{k}</p>
                    <p className="font-bold">{v}</p>
                  </div>
                </div>
              ))}

              <div className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
                <div className="w-full">
                  <p className="mb-2 text-ink-500">Walk-In Locations</p>
                  {[
                    {
                      city: "Islamabad",
                      lines: ["07-AUGUST-2026", "G-7/1 Building No. 23, Street No. 31"],
                    },
                    { city: "Sadiqabad", lines: ["13-AUGUST-2026", "Midway Hotel, Main G.T. Road,"] },
                  ].map((loc) => (
                    <div key={loc.city} className="mb-3 last:mb-0">
                      <p className="flex items-center gap-2 font-bold">
                        <span className="h-2 w-2 rounded-full bg-brand-500" />
                        {loc.city}
                      </p>
                      <ul className="mt-1.5 space-y-1 pl-4 text-ink-500">
                        {loc.lines.map((l) => (
                          <li key={l} className="list-disc">
                            {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="mb-4 text-[15px] font-bold">Share Job</h3>
            <div className="flex flex-wrap gap-3">
              {[
                { Icon: Facebook, bg: "bg-[#1877f2]" },
                { Icon: Twitter, bg: "bg-[#1da1f2]" },
                { Icon: Linkedin, bg: "bg-[#0a66c2]" },
                { Icon: Square, bg: "bg-[#25d366]" },
                { Icon: Link2, bg: "bg-brand-500" },
              ].map(({ Icon, bg }, i) => (
                <button
                  key={i}
                  className={`grid h-10 w-10 place-items-center rounded-full text-white ${bg} transition hover:opacity-90`}
                >
                  <Icon className="h-[17px] w-[17px]" />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-[#f4f7fd] p-5">
            <p className="mb-1.5 flex items-center gap-2 text-[13px] font-bold text-brand-500">
              <HelpCircle className="h-4 w-4" /> Note
            </p>
            <p className="text-[12px] leading-relaxed text-ink-500">
              Make sure all information is correct before publishing the job.
            </p>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}
