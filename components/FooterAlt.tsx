import { Send } from "lucide-react";
import Logo from "./Logo";
import { LinkedinIcon as Linkedin, FacebookIcon as Facebook, InstagramIcon as Instagram, XIcon } from "./SocialIcons";

const columns = [
  { title: "For Job Seekers", links: [{ label: "Browse Jobs", href: "/jobs" }, { label: "Companies", href: "/companies" }, { label: "Articles", href: "/articles" }, { label: "Career Advice", href: "/articles" }] },
  { title: "For Employers", links: [{ label: "Post a Job", href: "/employer-dashboard" }, { label: "Pricing", href: "/register" }, { label: "Employer Resources", href: "/employer-dashboard" }, { label: "Help Center", href: "/login" }] },
  { title: "Company", links: [{ label: "About Us", href: "/" }, { label: "Contact Us", href: "/login" }, { label: "Privacy Policy", href: "/register" }, { label: "Terms of Service", href: "/register" }] },
];

export default function FooterAlt() {
  return (
    <footer className="bg-[#0B2B26] text-slate-300 mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-1 md:grid-cols-5 gap-10">
        <div className="md:col-span-1">
          <Logo />
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
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Stay Connected</h4>
          <p className="text-sm text-slate-400 mb-3">Get the latest job updates and insights straight to your inbox.</p>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button className="bg-blue-600 hover:bg-blue-700 rounded-md w-9 h-9 flex items-center justify-center shrink-0">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 cursor-pointer">
              <Linkedin className="w-3.5 h-3.5" />
            </span>
            <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 cursor-pointer">
              <XIcon className="w-3 h-3" />
            </span>
            <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 cursor-pointer">
              <Facebook className="w-3.5 h-3.5" />
            </span>
            <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 cursor-pointer">
              <Instagram className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2025 Energy Tail. All rights reserved.</span>
          <span>Made with ❤ for the Energy Industry</span>
        </div>
      </div>
    </footer>
  );
}
