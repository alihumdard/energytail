import Link from "next/link";
import { Linkedin, Facebook, Twitter, Instagram, Youtube } from "@/components/Shared";

const columns = [
  {
    title: "For Job Seekers",
    links: [
      { label: "Browse Jobs", href: "/jobs" },
      { label: "Create Profile", href: "/register" },
      { label: "Saved Jobs", href: "/jobs" },
      { label: "Job Alerts", href: "/jobs" },
      { label: "Career Advice", href: "/articles" },
    ],
  },
  {
    title: "For Employers",
    links: [
      { label: "Post a Job", href: "/employer-dashboard" },
      { label: "Packages & Pricing", href: "/register" },
      { label: "Employer Dashboard", href: "/employer-dashboard" },
      { label: "Company Profile", href: "/employer/company-profile" },
      { label: "Search Resumes", href: "/jobs" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Articles", href: "/articles" },
      { label: "Industry News", href: "/articles" },
      { label: "Salary Guide", href: "/jobs" },
      { label: "Companies", href: "/companies" },
      { label: "Categories", href: "/admin/job-categories" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/" },
      { label: "Contact Us", href: "/login" },
      { label: "Terms of Use", href: "/register" },
      { label: "Privacy Policy", href: "/register" },
      { label: "Sitemap", href: "/" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-[#0B2B26] text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-10">
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Energy Tail" className="h-10 w-auto object-contain" />
          </Link>
          <p className="text-xs text-slate-400 mt-2">Oil, Gas &amp; Energy Jobs</p>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed">
            Connecting energy professionals with top employers worldwide.
          </p>
          <div className="flex gap-3 mt-5">
            {[Linkedin, Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
              <span
                key={i}
                className="w-8 h-8 grid place-items-center rounded-full border border-slate-600 hover:border-blue-400 hover:text-blue-400 cursor-pointer transition-colors"
              >
                <Icon />
              </span>
            ))}
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-white text-sm font-semibold mb-4">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>© 2024 Energy Tail. All rights reserved.</p>
          <p>
            Made with <span className="text-red-400">♥</span> for the Energy Community
          </p>
        </div>
      </div>
    </footer>
  );
}