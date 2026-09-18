"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import UtilityBar from "./UtilityBar";
import HeaderAuthControls from "./HeaderAuthControls";
import { publicNavItems as navItems } from "@/lib/nav/useHeaderNav";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header>
      <UtilityBar />
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-3.5 flex items-center justify-between gap-6">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="hover:text-blue-600">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <HeaderAuthControls variant="outlined" />
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-md"
              aria-label="Toggle menu"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-b border-slate-100 bg-white">
          <nav className="px-4 py-3 flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 border-b border-slate-50 text-sm font-medium text-slate-600 hover:text-blue-600"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <HeaderAuthControls
                variant="outlined"
                layout="stack"
                onNavigate={() => setOpen(false)}
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
