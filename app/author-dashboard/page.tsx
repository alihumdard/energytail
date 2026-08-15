"use client";

import Link from "next/link";
import DashboardShell, { NavSection } from "@/components/DashboardShell";
import {
  Home,
  FileText,
  PenLine,
  FileEdit,
  CalendarDays,
  FolderTree,
  UserRound,
  Settings,
  HelpCircle,
  Eye,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  Award,
  ArrowRight,
  MoreVertical,
} from "lucide-react";

const sections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", icon: Home, href: "/author-dashboard", active: true },
      { label: "My Articles", icon: FileText, href: "#" },
      { label: "Create Article", icon: PenLine, href: "#" },
      { label: "Drafts", icon: FileEdit, href: "#", badge: 3 },
      { label: "Editorial Calendar", icon: CalendarDays, href: "#" },
      { label: "Categories", icon: FolderTree, href: "#" },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { label: "Profile", icon: UserRound, href: "#" },
      { label: "Settings", icon: Settings, href: "#" },
      { label: "Help Center", icon: HelpCircle, href: "#" },
    ],
  },
];

const stats = [
  { label: "Published Articles", value: "18", icon: FileText, iconBg: "bg-blue-50 text-blue-600", trend: "↑ 12% vs last week" },
  { label: "Total Views", value: "6,842", icon: Eye, iconBg: "bg-emerald-50 text-emerald-600", trend: "↑ 18% vs last week" },
  { label: "Total Likes", value: "324", icon: ThumbsUp, iconBg: "bg-violet-50 text-violet-600", trend: "↑ 9% vs last week" },
  { label: "Comments", value: "87", icon: MessageCircle, iconBg: "bg-orange-50 text-orange-600", trend: "↑ 6% vs last week" },
  { label: "Bookmarks", value: "156", icon: Bookmark, iconBg: "bg-sky-50 text-sky-600", trend: "↑ 15% vs last week" },
];

const recentArticles = [
  {
    title: "The Future of Hydrogen Energy in the Oil & Gas Industry",
    status: "Published",
    date: "May 17, 2025",
    views: "1,248",
    likes: "68",
    comments: "18",
    grad: "from-slate-700 to-slate-500",
  },
  {
    title: "How Digital Transformation is Changing Energy Operations",
    status: "Published",
    date: "May 14, 2025",
    views: "1,036",
    likes: "52",
    comments: "12",
    grad: "from-orange-700 to-amber-500",
  },
  {
    title: "Top 10 Renewable Energy Trends to Watch in 2025",
    status: "Published",
    date: "May 10, 2025",
    views: "1,752",
    likes: "91",
    comments: "21",
    grad: "from-sky-700 to-blue-400",
  },
  {
    title: "Enhancing Safety in Offshore Drilling Operations",
    status: "Draft",
    date: "May 18, 2025",
    views: "—",
    likes: "—",
    comments: "—",
    grad: "from-slate-600 to-slate-400",
  },
  {
    title: "The Role of AI in Predictive Maintenance",
    status: "Draft",
    date: "May 16, 2025",
    views: "—",
    likes: "—",
    comments: "—",
    grad: "from-indigo-700 to-blue-500",
  },
];

const drafts = [
  { title: "Carbon Capture Technologies Explained", edited: "Last edited: May 18, 2025" },
  { title: "Sustainable Practices in Modern Refineries", edited: "Last edited: May 16, 2025" },
  { title: "Energy Storage Solutions for the Future", edited: "Last edited: May 15, 2025" },
];

const whatsNext = [
  { icon: PenLine, title: "Continue Writing", body: "You have 3 drafts in progress.", cta: "Continue" },
  { icon: CalendarDays, title: "Editorial Calendar", body: "Plan your upcoming articles.", cta: "View Calendar" },
  { icon: FolderTree, title: "Browse Categories", body: "Explore trending topics.", cta: "Explore" },
];

export default function AuthorDashboardPage() {
  const maxVal = 2000;
  const points = [1000, 1520, 1180, 1400, 1080, 1420, 1842];
  const days = ["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"];
  const w = 100 / (points.length - 1);
  const pathPoints = points.map((p, i) => `${i * w},${100 - (p / maxVal) * 100}`).join(" ");

  return (
    <DashboardShell
      sections={sections}
      searchPlaceholder="Search jobs, companies, articles..."
      searchTypeLabel="Articles"
      userName="Ahmed Raza"
      userRole="Article Author"
      notifCount={5}
      msgCount={2}
      planTitle="Upgrade Your Plan"
      planBody="Get more visibility and reach thousands of energy professionals."
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, Ahmed! 👋</h1>
          <p className="text-sm text-slate-500 mt-1">
            Here&apos;s an overview of your articles and performance.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shrink-0">
          <CalendarDays size={15} /> May 12 – May 18, 2025
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <span className={`w-10 h-10 rounded-lg grid place-items-center ${s.iconBg}`}>
                <s.icon size={18} />
              </span>
            </div>
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{s.value}</p>
            <p className="text-xs font-medium text-emerald-600 mt-1.5">{s.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6 min-w-0">
          {/* Recent Articles */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Recent Articles</h3>
              <Link href="/admin/articles" className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                View All Articles <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-4">
              {recentArticles.map((a) => (
                <div key={a.title} className="flex items-center gap-4">
                  <div className={`w-16 h-12 rounded-lg bg-gradient-to-br ${a.grad} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          a.status === "Published"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {a.status}
                      </span>
                      <span className="text-xs text-slate-400">• {a.date}</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <Eye size={13} /> {a.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={13} /> {a.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={13} /> {a.comments}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 shrink-0">
                    <MoreVertical size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Performing Article */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <Award size={16} className="text-amber-500" /> Top Performing Article
              </h3>
              <div className="w-full h-28 rounded-lg bg-gradient-to-br from-slate-700 to-slate-500 mb-3" />
              <p className="text-sm font-semibold text-slate-800 leading-snug">
                The Future of Hydrogen Energy in the Oil &amp; Gas Industry
              </p>
              <p className="text-xs text-slate-400 mt-1">Published on May 17, 2025</p>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                <span className="flex items-center gap-1">
                  <Eye size={13} /> 1,248 Views
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp size={13} /> 68 Likes
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5">
                <span className="flex items-center gap-1">
                  <MessageCircle size={13} /> 18 Comments
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark size={13} /> 32 Bookmarks
                </span>
              </div>
              <Link
                href="/articles"
                className="mt-4 inline-block text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                View Article
              </Link>
            </div>

            {/* Drafts */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Drafts</h3>
                <Link href="/admin/articles" className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                  View All Drafts <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-3">
                {drafts.map((d) => (
                  <div key={d.title} className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 grid place-items-center shrink-0">
                      <FileEdit size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{d.title}</p>
                      <p className="text-xs text-slate-400">{d.edited}</p>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 shrink-0">
                      <MoreVertical size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6 min-w-0">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">Article Performance Overview</h3>
              <span className="text-xs font-medium text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5">
                Last 7 Days
              </span>
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-40">
              <polyline
                points={pathPoints}
                fill="none"
                stroke="#2563eb"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              <polygon points={`0,100 ${pathPoints} 100,100`} fill="url(#grad2)" opacity="0.15" />
              <defs>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex justify-between text-[11px] text-slate-400 mt-2">
              {days.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 inline-block">
              May 17, 2025 · <span className="font-semibold text-slate-600">Views 1,842</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4">What&apos;s Next?</h3>
            <div className="space-y-1">
              {whatsNext.map((w) => (
                <div
                  key={w.title}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 grid place-items-center shrink-0">
                    <w.icon size={18} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-800">{w.title}</span>
                    <span className="block text-xs text-slate-400">{w.body}</span>
                  </span>
                  <button className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 shrink-0">
                    {w.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}