"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import Logo from "./Logo";
import HeaderAuthControls from "./HeaderAuthControls";

export default function HeaderAlt() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between gap-6">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="/jobs" className="hover:text-blue-600">Jobs</Link>
          <Link href="/companies" className="hover:text-blue-600">Companies</Link>
          <Link href="/articles" className="hover:text-blue-600">Articles</Link>
          <Link href="/register?role=employer" className="flex items-center gap-1 hover:text-blue-600">
            For Employers <ChevronDown className="w-3.5 h-3.5" />
          </Link>
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          <HeaderAuthControls variant="outlined" />
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-md"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <nav className="px-4 py-3 flex flex-col">
            <Link href="/jobs" onClick={() => setOpen(false)} className="py-3 border-b border-slate-50 text-sm font-medium text-slate-600 hover:text-blue-600">
              Jobs
            </Link>
            <Link href="/companies" onClick={() => setOpen(false)} className="py-3 border-b border-slate-50 text-sm font-medium text-slate-600 hover:text-blue-600">
              Companies
            </Link>
            <Link href="/articles" onClick={() => setOpen(false)} className="py-3 border-b border-slate-50 text-sm font-medium text-slate-600 hover:text-blue-600">
              Articles
            </Link>
            <Link href="/register?role=employer" onClick={() => setOpen(false)} className="py-3 border-b border-slate-50 text-sm font-medium text-slate-600 hover:text-blue-600">
              For Employers
            </Link>
            <div className="mt-3 flex flex-col gap-2">
              <HeaderAuthControls variant="outlined" layout="stack" onNavigate={() => setOpen(false)} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
