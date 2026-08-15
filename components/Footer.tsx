import Logo from "./Logo";
import { LinkedinIcon as Linkedin, FacebookIcon as Facebook, InstagramIcon as Instagram, YoutubeIcon as Youtube, XIcon } from "./SocialIcons";

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

export default function Footer() {
  return (
    <footer className="bg-[#0B2B26] text-slate-300 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 grid grid-cols-1 md:grid-cols-5 gap-10">
        <div className="md:col-span-1 space-y-4">
          <Logo />
          <p className="text-sm text-slate-400 leading-relaxed">
            Connecting energy professionals with top employers worldwide.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <Linkedin className="w-4 h-4 hover:text-white cursor-pointer" />
            <Facebook className="w-4 h-4 hover:text-white cursor-pointer" />
            <XIcon className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
            <Instagram className="w-4 h-4 hover:text-white cursor-pointer" />
            <Youtube className="w-4 h-4 hover:text-white cursor-pointer" />
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-white font-semibold mb-4 text-sm">{col.title}</h4>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-400">
          © 2024 Energy Tail. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
