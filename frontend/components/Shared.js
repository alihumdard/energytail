"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Mail,
  MessageSquare,
  Menu,
  Phone,
  Search,
  Send,
  X,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------- Brand SVG icons */

export function Facebook({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function Twitter({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Linkedin({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function Instagram({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

export function Youtube({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

/* ---------------------------------------------------------------- Logo */

export function Logo({ light = false, compact = false }) {
  return (
    <Link href="/" className="flex shrink-0 items-center">
      <img
        src="/logo.png"
        alt="Energy Tail"
        className={`h-10 w-auto object-contain ${light ? "brightness-0 invert" : ""}`}
      />
      {!compact && light && (
        <span className="ml-2 hidden text-[10.5px] font-medium text-white/70 sm:block">
          Oil, Gas &amp; Energy Jobs
        </span>
      )}
    </Link>
  );
}

/* -------------------------------------------------------------- Avatar */

export function Avatar({ size = 36, tone = "man" }) {
  const tones = {
    man: "from-[#c58a63] to-[#7b4a2f]",
    woman: "from-[#d8a48f] to-[#8a5a49]",
    man2: "from-[#a3b6c9] to-[#4d637a]",
  };
  return (
    <span
      style={{ width: size, height: size }}
      className={`relative block shrink-0 overflow-hidden rounded-full bg-gradient-to-b ${tones[tone]}`}
    >
      <span className="absolute left-1/2 top-[22%] h-[36%] w-[36%] -translate-x-1/2 rounded-full bg-white/35" />
      <span className="absolute left-1/2 top-[62%] h-[52%] w-[74%] -translate-x-1/2 rounded-t-full bg-[#1f3b5c]/80" />
    </span>
  );
}

/* ------------------------------------------------- Public site header */

export function PublicHeader({ active = "Jobs", user = "John Smith", role = "Job Seeker" }) {
  const [open, setOpen] = useState(false);
  const links = ["Jobs", "Companies", "Articles"];

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8edf5] bg-white">
      <div className="mx-auto flex h-[74px] max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="relative ml-2 hidden max-w-[460px] flex-1 lg:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            className="h-11 w-full rounded-xl border border-[#e2e8f2] bg-[#f8fafc] pl-11 pr-16 text-[13px] outline-none focus:border-brand-500"
            placeholder="Search for jobs, companies, articles..."
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-[#e2e8f2] bg-white px-2 py-1 text-[10.5px] font-semibold text-ink-500">
            Ctrl + K
          </kbd>
        </div>

        <nav className="ml-auto hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l}
              href={l === "Jobs" ? "/jobs" : l === "Articles" ? "/articles" : "/companies"}
              className={`relative py-6 text-[13.5px] font-semibold transition ${
                active === l ? "text-brand-500" : "text-ink-700 hover:text-brand-500"
              }`}
            >
              {l}
              {active === l && (
                <span className="absolute inset-x-0 bottom-4 h-[2.5px] rounded-full bg-brand-500" />
              )}
            </Link>
          ))}
          <button className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-700 hover:text-brand-500">
            For Employers <ChevronDown className="h-4 w-4" />
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:ml-6">
          <button className="hidden text-ink-500 hover:text-brand-500 sm:block">
            <MessageSquare className="h-[21px] w-[21px]" />
          </button>
          <button className="relative hidden text-ink-500 hover:text-brand-500 sm:block">
            <Bell className="h-[21px] w-[21px]" />
            <span className="absolute -right-1.5 -top-1.5 grid h-[17px] w-[17px] place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>
          <div className="hidden items-center gap-2.5 sm:flex">
            <Avatar size={38} />
            <span className="hidden leading-tight md:block">
              <span className="block text-[13px] font-bold">{user}</span>
              <span className="block text-[11px] text-ink-500">{role}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-ink-500" />
          </div>
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#e8edf5] bg-white px-4 pb-5 pt-3 lg:hidden">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              className="h-11 w-full rounded-xl border border-[#e2e8f2] bg-[#f8fafc] pl-11 pr-4 text-[13px] outline-none"
              placeholder="Search for jobs, companies, articles..."
            />
          </div>
          {[...links, "For Employers"].map((l) => (
            <Link
              key={l}
              href={l === "Jobs" ? "/jobs" : l === "For Employers" ? "/employer-dashboard" : l === "Articles" ? "/articles" : "/companies"}
              className="block border-b border-[#f1f5f9] py-3 text-[14px] font-semibold text-ink-700"
            >
              {l}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------- Public site footer (light) */

const footerCols = [
  {
    title: "For Job Seekers",
    items: [
      { label: "Browse Jobs", href: "/jobs" },
      { label: "Companies", href: "/companies" },
      { label: "Articles", href: "/articles" },
      { label: "Career Advice", href: "/articles" },
      { label: "Create Profile", href: "/register" },
    ],
  },
  {
    title: "For Employers",
    items: [
      { label: "Post a Job", href: "/employer-dashboard" },
      { label: "Search Candidates", href: "/jobs" },
      { label: "Employer Branding", href: "/employer/company-profile" },
      { label: "Pricing", href: "/register" },
      { label: "Resources", href: "/articles" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Us", href: "/" },
      { label: "Contact Us", href: "/login" },
      { label: "Privacy Policy", href: "/register" },
      { label: "Terms of Service", href: "/register" },
      { label: "Cookie Policy", href: "/register" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Help Center", href: "/login" },
      { label: "Contact Support", href: "/login" },
      { label: "FAQs", href: "/login" },
      { label: "Security", href: "/login" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-[#e8edf5] bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)_1.6fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[240px] text-[12.5px] leading-relaxed text-ink-500">
              Connecting energy professionals with top opportunities in oil, gas and the broader
              energy sector.
            </p>
            <div className="mt-5 flex gap-2.5">
              {[Linkedin, Twitter, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="/"
                  className="grid h-9 w-9 place-items-center rounded-full border border-[#e2e8f2] text-ink-500 transition hover:border-brand-500 hover:text-brand-500"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerCols.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-[13.5px] font-bold">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.items.map((i) => (
                  <li key={i.label}>
                    <a href={i.href} className="text-[12.5px] text-ink-500 hover:text-brand-500">
                      {i.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-4 text-[13.5px] font-bold">Subscribe to Newsletter</h4>
            <p className="mb-3 text-[12.5px] text-ink-500">
              Get the latest jobs and industry news.
            </p>
            <div className="flex">
              <input
                className="h-11 w-full rounded-l-lg border border-r-0 border-[#e2e8f2] px-3.5 text-[12.5px] outline-none focus:border-brand-500"
                placeholder="Enter your email"
              />
              <button className="grid h-11 w-12 shrink-0 place-items-center rounded-r-lg bg-brand-500 text-white hover:bg-brand-600">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex gap-2.5">
              {[Linkedin, Twitter, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="/"
                  className="grid h-9 w-9 place-items-center rounded-full border border-[#e2e8f2] text-ink-500 transition hover:border-brand-500 hover:text-brand-500"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[#eef2f7] pt-6 text-[12px] text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2025 Energy Tail. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            Made with <span className="text-red-500">❤</span> for the Energy Industry
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------ Marketing header + dark footer (companies) */

export function MarketingTopStrip() {
  return (
    <div className="bg-[#0B2B26] text-white">
      <div className="mx-auto flex h-11 max-w-[1440px] items-center gap-6 px-4 text-[12px] sm:px-6 lg:px-8">
        <span className="hidden items-center gap-2 md:flex">
          <Mail className="h-3.5 w-3.5" /> info@energytail.com
        </span>
        <span className="hidden h-4 w-px bg-white/20 md:block" />
        <span className="hidden items-center gap-2 md:flex">
          <Phone className="h-3.5 w-3.5" /> +971 50 123 4567
        </span>
        <span className="mx-auto hidden items-center gap-2 lg:flex">
          <Zap className="h-3.5 w-3.5 text-brand-500" /> Connecting Energy Professionals with Top
          Opportunities
        </span>
        <div className="ml-auto flex items-center gap-3.5 lg:ml-0">
          {[Linkedin, Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
            <a key={i} href="/" className="text-white/80 hover:text-white">
              <Icon className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MarketingHeader({ active = "Companies" }) {
  const [open, setOpen] = useState(false);
  const links = ["Jobs", "Companies", "Categories", "Articles", "Locations", "Packages", "About Us"];
  return (
    <header className="sticky top-0 z-40 border-b border-[#e8edf5] bg-white">
      <div className="mx-auto flex h-[74px] max-w-[1440px] items-center px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="mx-auto hidden items-center gap-7 xl:flex">
          {links.map((l) => (
            <Link
              key={l}
              href={
                l === "Jobs"
                  ? "/jobs"
                  : l === "Companies"
                    ? "/companies"
                    : l === "Categories"
                      ? "/admin/job-categories"
                      : l === "Locations"
                        ? "/admin/countries"
                        : "/articles"
              }
              className={`relative py-6 text-[13.5px] font-semibold transition ${
                active === l ? "text-brand-500" : "text-ink-700 hover:text-brand-500"
              }`}
            >
              {l}
              {active === l && (
                <span className="absolute inset-x-0 bottom-4 h-[2.5px] rounded-full bg-brand-500" />
              )}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-3 xl:flex">
          <Link className="btn h-10 border border-[#dfe6f1] text-ink-700 hover:bg-slate-50" href="/login">
            Login
          </Link>
          <Link className="btn h-10 border border-brand-500 text-brand-500 hover:bg-brand-50" href="/register">
            Register
          </Link>
          <Link className="btn-primary h-10" href="/employer-dashboard">
            <Send className="h-4 w-4" /> Post a Job
          </Link>
        </div>
        <button className="ml-auto xl:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-[#e8edf5] bg-white px-4 pb-5 pt-2 xl:hidden">
          {links.map((l) => (
            <Link
              key={l}
              href={
                l === "Jobs"
                  ? "/jobs"
                  : l === "Companies"
                    ? "/companies"
                    : l === "Categories"
                      ? "/admin/job-categories"
                      : l === "Locations"
                        ? "/admin/countries"
                        : "/articles"
              }
              className="block border-b border-[#f1f5f9] py-3 text-[14px] font-semibold text-ink-700"
            >
              {l}
            </Link>
          ))}
          <Link className="btn-primary mt-4 w-full" href="/employer-dashboard">Post a Job</Link>
        </div>
      )}
    </header>
  );
}

const darkFooterCols = [
  {
    title: "For Job Seekers",
    items: [
      { label: "Browse Jobs", href: "/jobs" },
      { label: "Create Profile", href: "/register" },
      { label: "Saved Jobs", href: "/jobs" },
      { label: "Job Alerts", href: "/jobs" },
      { label: "Career Advice", href: "/articles" },
    ],
  },
  {
    title: "For Employers",
    items: [
      { label: "Post a Job", href: "/employer-dashboard" },
      { label: "Packages & Pricing", href: "/register" },
      { label: "Employer Dashboard", href: "/employer-dashboard" },
      { label: "Company Profile", href: "/employer/company-profile" },
      { label: "Search Resumes", href: "/jobs" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Articles", href: "/articles" },
      { label: "Industry News", href: "/articles" },
      { label: "Salary Guide", href: "/jobs" },
      { label: "Companies", href: "/companies" },
      { label: "Categories", href: "/admin/job-categories" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Us", href: "/" },
      { label: "Contact Us", href: "/login" },
      { label: "Terms of Use", href: "/register" },
      { label: "Privacy Policy", href: "/register" },
      { label: "Sitemap", href: "/" },
    ],
  },
];

export function DarkFooter() {
  return (
    <footer className="bg-[#0B2B26] text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-[250px] text-[12.5px] leading-relaxed text-white/60">
              Connecting energy professionals with top employers worldwide.
            </p>
            <div className="mt-6 flex gap-4">
              {[Linkedin, Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="/" className="text-white/70 hover:text-white">
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>
          {darkFooterCols.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-[13.5px] font-bold">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.items.map((i) => (
                  <li key={i.label}>
                    <a href={i.href} className="text-[12.5px] text-white/60 hover:text-white">
                      {i.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-[12px] text-white/55">
          © 2024 Energy Tail. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
