"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import HeaderAuthControls from "@/components/HeaderAuthControls";
import UtilityBar from "@/components/UtilityBar";
import Logo from "@/components/Logo";
import { publicNavItems as navLinks } from "@/lib/nav/useHeaderNav";

/**
 * Which nav item the current URL belongs to.
 *
 * Derived from the path rather than passed in by every page, since a page
 * that forgets to pass `active` (as /jobs did) silently loses its underline.
 * Matches on a path prefix so a detail route like /jobs/[slug] still
 * highlights "Jobs".
 */
function activeLabelFor(pathname: string): string | undefined {
  const match = navLinks
    .filter((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match?.label;
}

export default function SiteHeader({ active }: { active?: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const activeLabel = active || activeLabelFor(pathname);

  // A shadow only once the page has actually scrolled keeps the header flat
  // against the hero at the top, and lets it visually separate from content
  // once that content is sliding underneath it.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white">
      <UtilityBar />

      {/* Main nav */}
      <div
        className={`border-b border-slate-200 transition-shadow duration-200 ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-6">
          <Link href="/" className="flex shrink-0 items-center">
            <Logo />
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-semibold text-slate-600">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`group relative py-2 transition-colors hover:text-blue-600 ${
                  activeLabel === l.label ? "text-blue-600" : ""
                }`}
              >
                {l.label}
                <span
                  className={`absolute -bottom-[1px] left-0 h-0.5 rounded-full bg-blue-600 transition-all duration-300 ease-out ${
                    activeLabel === l.label
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <HeaderAuthControls />
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="rounded-md p-1.5 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-slate-200 px-6 py-4 space-y-3">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="block text-[14px] font-medium text-slate-700 hover:text-blue-600"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <HeaderAuthControls
                layout="stack"
                onNavigate={() => setOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
