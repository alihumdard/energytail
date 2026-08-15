import { Mail, Phone, Zap } from "lucide-react";
import { LinkedinIcon, FacebookIcon, InstagramIcon, YoutubeIcon, XIcon } from "./SocialIcons";

export default function TopBar() {
  return (
    <div className="bg-[#0B2B26] text-slate-300 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between gap-4">
        <div className="hidden sm:flex items-center gap-5">
          <a href="mailto:info@energytail.com" className="flex items-center gap-1.5 hover:text-white">
            <Mail className="w-3.5 h-3.5" />
            info@energytail.com
          </a>
          <a href="tel:+971501234567" className="flex items-center gap-1.5 hover:text-white">
            <Phone className="w-3.5 h-3.5" />
            +971 50 123 4567
          </a>
        </div>
        <div className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-slate-200">
          <Zap className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
          <span className="hidden md:inline">Connecting Energy Professionals with Top Opportunities</span>
        </div>
        <div className="flex items-center gap-3">
          <LinkedinIcon className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
          <FacebookIcon className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
          <XIcon className="w-3 h-3 hover:text-white cursor-pointer" />
          <InstagramIcon className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
          <YoutubeIcon className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
