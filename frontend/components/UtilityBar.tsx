import { Flame, Mail, Phone } from "lucide-react";
import { Linkedin, Facebook, Twitter } from "@/components/Shared";

/**
 * The thin dark strip above the header: tagline, contact details, socials.
 *
 * Extracted because the same bar was written twice — inlined in SiteHeader
 * and again in TopBar (used by the auth pages' Header) — and was missing
 * entirely from the dashboard shell, which is why signing in made it
 * disappear. One component means the contact details cannot drift apart
 * between screens.
 *
 * Hidden below lg: at phone widths it would either wrap onto three lines or
 * push the real navigation off the first screen.
 */
export default function UtilityBar() {
  return (
    <div className="hidden bg-[#0B2B26] text-xs tracking-wide text-slate-300 lg:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5">
        <p className="flex items-center gap-2">
          <Flame size={13} className="text-emerald-400" />
          The Leading Job Portal for Oil, Gas &amp; Energy Professionals
        </p>

        <div className="flex items-center gap-6">
          {/* Real mailto/tel links rather than plain text — on a phone the
              number should dial, and the address should open a compose window. */}
          <a
            href="mailto:info@energytail.com"
            className="flex items-center gap-1.5 transition-colors hover:text-white"
          >
            <Mail size={13} /> info@energytail.com
          </a>
          <a
            href="tel:+971501234567"
            className="flex items-center gap-1.5 transition-colors hover:text-white"
          >
            <Phone size={13} /> +971 50 123 4567
          </a>

          {/*
            Placeholder socials: there are no real profile URLs yet, so these
            stay non-interactive rather than becoming links back to the
            homepage, which is what they used to be.
          */}
          <span className="flex items-center gap-3.5 border-l border-slate-600/60 pl-4">
            <Linkedin />
            <Facebook />
            <Twitter />
          </span>
        </div>
      </div>
    </div>
  );
}
