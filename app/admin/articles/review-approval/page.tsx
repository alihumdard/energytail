"use client";

import { useState } from "react";
import {
  Search,
  FileText,
  FileStack,
  CheckCircle2,
  XCircle,
  FilePlus,
  ClipboardList,
  Eye,
  Check,
  X,
  MoreVertical,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User as UserIcon,
  Calendar,
  BookOpen,
  Clock,
  Paperclip,
} from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArticleRow {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  avatar: string;
  category: string;
  categoryColor: string;
  submittedOn: string;
  submittedTime: string;
  priority: "High" | "Medium" | "Low";
  thumbnail: string;
  status: "pending" | "approved" | "rejected";
}

// ---------------------------------------------------------------------------
// Mock data — replace with real data from your API
// ---------------------------------------------------------------------------

const articles: ArticleRow[] = [
  {
    id: 1,
    title: "Future of Offshore Wind Energy in 2025",
    excerpt: "A comprehensive look at emerging trends and...",
    author: "John Smith",
    avatar: "https://i.pravatar.cc/40?img=12",
    category: "Renewable Energy",
    categoryColor: "bg-emerald-100 text-emerald-700",
    submittedOn: "May 18, 2025",
    submittedTime: "10:30 AM",
    priority: "High",
    thumbnail:
      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=200&auto=format&fit=crop",
    status: "pending",
  },
  {
    id: 2,
    title: "LNG Demand to Surge in Asia",
    excerpt: "Asia's growing energy needs and LNG infrastructure...",
    author: "Sarah Johnson",
    avatar: "https://i.pravatar.cc/40?img=32",
    category: "LNG",
    categoryColor: "bg-blue-100 text-blue-700",
    submittedOn: "May 18, 2025",
    submittedTime: "09:15 AM",
    priority: "Medium",
    thumbnail:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=200&auto=format&fit=crop",
    status: "pending",
  },
  {
    id: 3,
    title: "Global Oil Market Outlook 2025",
    excerpt: "Key factors influencing oil prices and market...",
    author: "Michael Brown",
    avatar: "https://i.pravatar.cc/40?img=13",
    category: "Oil & Gas",
    categoryColor: "bg-sky-100 text-sky-700",
    submittedOn: "May 17, 2025",
    submittedTime: "02:45 PM",
    priority: "High",
    thumbnail:
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=200&auto=format&fit=crop",
    status: "approved",
  },
  {
    id: 4,
    title: "Top HSE Practices in Oil & Gas",
    excerpt: "Essential safety practices every company should...",
    author: "Emily Davis",
    avatar: "https://i.pravatar.cc/40?img=45",
    category: "HSE",
    categoryColor: "bg-amber-100 text-amber-700",
    submittedOn: "May 17, 2025",
    submittedTime: "11:20 AM",
    priority: "High",
    thumbnail:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=200&auto=format&fit=crop",
    status: "pending",
  },
  {
    id: 5,
    title: "Solar Energy Investments Guide",
    excerpt: "How to invest in solar projects for maximum ROI...",
    author: "David Wilson",
    avatar: "https://i.pravatar.cc/40?img=14",
    category: "Solar Energy",
    categoryColor: "bg-emerald-100 text-emerald-700",
    submittedOn: "May 17, 2025",
    submittedTime: "09:05 AM",
    priority: "Low",
    thumbnail:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=200&auto=format&fit=crop",
    status: "rejected",
  },
  {
    id: 6,
    title: "Pipeline Safety Management",
    excerpt: "Best practices for pipeline integrity and safety...",
    author: "Jessica Lee",
    avatar: "https://i.pravatar.cc/40?img=47",
    category: "Oil & Gas",
    categoryColor: "bg-sky-100 text-sky-700",
    submittedOn: "May 17, 2025",
    submittedTime: "04:30 PM",
    priority: "Medium",
    thumbnail:
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=200&auto=format&fit=crop",
    status: "approved",
  },
  {
    id: 7,
    title: "Power Generation Trends 2025",
    excerpt: "Technologies shaping the future of power generation...",
    author: "Robert Taylor",
    avatar: "https://i.pravatar.cc/40?img=15",
    category: "Power Generation",
    categoryColor: "bg-violet-100 text-violet-700",
    submittedOn: "May 16, 2025",
    submittedTime: "01:10 PM",
    priority: "Low",
    thumbnail:
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=200&auto=format&fit=crop",
    status: "pending",
  },
  {
    id: 8,
    title: "Carbon Capture Technologies",
    excerpt: "Innovations in carbon capture and storage...",
    author: "James Anderson",
    avatar: "https://i.pravatar.cc/40?img=16",
    category: "Environment",
    categoryColor: "bg-teal-100 text-teal-700",
    submittedOn: "May 16, 2025",
    submittedTime: "10:00 AM",
    priority: "Medium",
    thumbnail:
      "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=200&auto=format&fit=crop",
    status: "approved",
  },
];

const priorityStyles: Record<ArticleRow["priority"], string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

const tabs = [
  { key: "pending", label: "Pending Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All Submitted" },
];

const statusStyles: Record<ArticleRow["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const statusLabels: Record<ArticleRow["status"], string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

const categories = Array.from(
  new Set(articles.map((a) => a.category))
);

export default function ArticleReviewApprovalPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedArticleId, setSelectedArticleId] = useState(articles[0].id);
  const [adminNote, setAdminNote] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [articleList, setArticleList] = useState<ArticleRow[]>(articles);

  const selectedArticle =
    articleList.find((a) => a.id === selectedArticleId) ?? articleList[0];

  const filteredArticles =
    (activeTab === "all"
      ? articleList
      : articleList.filter((a) => a.status === activeTab)
    ).filter((a) => categoryFilter === "all" || a.category === categoryFilter);

  const pendingCount = articleList.filter((a) => a.status === "pending").length;
  const approvedCount = articleList.filter((a) => a.status === "approved").length;
  const rejectedCount = articleList.filter((a) => a.status === "rejected").length;

  const updateStatus = (id: number, status: ArticleRow["status"]) => {
    setArticleList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    setAdminNote("");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar active="articles" sticky={false} />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar variant="dark" sticky={false} />

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Article Review / Approval
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
              <span>Dashboard</span>
              <span>&gt;</span>
              <span>Articles</span>
              <span>&gt;</span>
              <span className="text-slate-500">Review / Approval</span>
            </p>
          </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              {/* Left: list */}
              <div className="min-w-0">
                {/* Stat cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                  <StatCard
                    icon={FileStack}
                    iconBg="bg-amber-50 text-amber-500"
                    label="Pending Review"
                    value={String(pendingCount)}
                    sub="Requires your action"
                  />
                  <StatCard
                    icon={CheckCircle2}
                    iconBg="bg-emerald-50 text-emerald-500"
                    label="Approved"
                    value={String(approvedCount)}
                    sub="This month"
                  />
                  <StatCard
                    icon={XCircle}
                    iconBg="bg-red-50 text-red-500"
                    label="Rejected"
                    value={String(rejectedCount)}
                    sub="This month"
                  />
                  <StatCard
                    icon={FilePlus}
                    iconBg="bg-violet-50 text-violet-500"
                    label="Draft"
                    value="95"
                    sub="Awaiting submission"
                  />
                  <StatCard
                    icon={ClipboardList}
                    iconBg="bg-blue-50 text-blue-500"
                    label="Total Articles"
                    value={String(articleList.length)}
                    sub="All time"
                  />
                </div>

                {/* Tabs */}
                <div className="mb-4 flex gap-6 overflow-x-auto whitespace-nowrap border-b border-slate-200">
                  {tabs.map((tab) => {
                    const count =
                      tab.key === "pending"
                        ? pendingCount
                        : tab.key === "approved"
                          ? approvedCount
                          : tab.key === "rejected"
                            ? rejectedCount
                            : articleList.length;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`relative pb-3 text-sm font-medium transition-colors ${
                          activeTab === tab.key
                            ? "text-blue-600"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {tab.label} ({count})
                        {activeTab === tab.key && (
                          <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-blue-600" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Filters */}
                <div className="mb-4 flex flex-wrap items-center gap-2 lg:flex-nowrap lg:gap-3">
                  <div className="flex items-center gap-2">
                    <select className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 focus:outline-none">
                      <option>Bulk Actions</option>
                      <option>Approve Selected</option>
                      <option>Reject Selected</option>
                    </select>
                    <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                      Apply
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap lg:gap-3">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 focus:outline-none"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <select className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 focus:outline-none">
                      <option>All Authors</option>
                    </select>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search articles..."
                        className="w-40 rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-600 focus:outline-none lg:w-44"
                      />
                    </div>
                    <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50">
                      <Filter className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400">
                          <th className="w-10 px-4 py-3">
                            <input type="checkbox" className="rounded" />
                          </th>
                          <th className="px-4 py-3">Article</th>
                          <th className="px-4 py-3">Author</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Submitted On</th>
                          <th className="px-4 py-3">Priority</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredArticles.map((article) => (
                          <tr
                            key={article.id}
                            onClick={() => setSelectedArticleId(article.id)}
                            className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                              selectedArticleId === article.id
                                ? "bg-blue-50/40"
                                : ""
                            }`}
                          >
                            <td className="px-4 py-3">
                              <input type="checkbox" className="rounded" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={article.thumbnail}
                                  alt=""
                                  className="h-10 w-14 shrink-0 rounded-lg object-cover"
                                />
                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {article.title}
                                  </p>
                                  <p className="max-w-xs truncate text-xs text-slate-400">
                                    {article.excerpt}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={article.avatar}
                                  alt=""
                                  className="h-7 w-7 rounded-full object-cover"
                                />
                                <span className="text-slate-600">
                                  {article.author}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-md px-2.5 py-1 text-xs font-medium ${article.categoryColor}`}
                              >
                                {article.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              <p>{article.submittedOn}</p>
                              <p className="text-xs text-slate-400">
                                {article.submittedTime}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                                  priorityStyles[article.priority]
                                }`}
                              >
                                {article.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-md px-2.5 py-1 text-xs font-medium ${statusStyles[article.status]}`}
                              >
                                {statusLabels[article.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 text-slate-400">
                                <button className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-600">
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => updateStatus(article.id, "approved")}
                                  className="rounded-lg p-1.5 hover:bg-emerald-50 hover:text-emerald-600"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => updateStatus(article.id, "rejected")}
                                  className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <button className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-600">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
                    <p className="text-sm text-slate-400">
                      Showing 1 to {filteredArticles.length} of {filteredArticles.length} articles
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {[1, 2, 3, 4, 5].map((page) => (
                        <button
                          key={page}
                          className={`h-8 w-8 rounded-lg text-sm font-medium ${
                            page === 1
                              ? "border border-blue-500 text-blue-600"
                              : "text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <span className="px-1 text-slate-400">...</span>
                      <button className="h-8 w-8 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50">
                        8
                      </button>
                      <button className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <select className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-500 focus:outline-none">
                        <option>10 / page</option>
                        <option>25 / page</option>
                        <option>50 / page</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: preview panel */}
              <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 xl:sticky xl:top-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Preview
                  </h2>
                  <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                    View Full Article
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>

                <img
                  src={selectedArticle.thumbnail}
                  alt=""
                  className="mb-4 h-40 w-full rounded-xl object-cover"
                />

                <span
                  className={`mb-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${statusStyles[selectedArticle.status]}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {statusLabels[selectedArticle.status]}
                </span>

                <h3 className="mb-2 text-lg font-bold leading-snug text-slate-900">
                  {selectedArticle.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-slate-500">
                  {selectedArticle.excerpt} opportunities in offshore wind
                  energy, technology advancements, and market outlook for
                  2025 and beyond.
                </p>

                <dl className="mb-4 space-y-2.5 text-sm">
                  <MetaRow icon={UserIcon} label="Author">
                    {selectedArticle.author}
                  </MetaRow>
                  <MetaRow icon={Calendar} label="Submitted On">
                    {selectedArticle.submittedOn} {selectedArticle.submittedTime}
                  </MetaRow>
                  <MetaRow icon={BookOpen} label="Category">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${selectedArticle.categoryColor}`}
                    >
                      {selectedArticle.category}
                    </span>
                  </MetaRow>
                  <MetaRow icon={Clock} label="Reading Time">
                    8 min read
                  </MetaRow>
                  <MetaRow icon={FileText} label="Word Count">
                    1,856 words
                  </MetaRow>
                  <MetaRow icon={Paperclip} label="Attachments">
                    2 images
                  </MetaRow>
                </dl>

                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Admin Notes
                </p>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add internal note about this article..."
                  rows={3}
                  className="mb-4 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm text-slate-600 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />

                <div className="space-y-2.5">
                  <button
                    onClick={() => updateStatus(selectedArticle.id, "approved")}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve &amp; Publish
                  </button>
                  <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600">
                    <FileText className="h-4 w-4" />
                    Request Changes
                  </button>
                  <button
                    onClick={() => updateStatus(selectedArticle.id, "rejected")}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Article
                  </button>
                  <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    Save for Later
                  </button>
                </div>
              </aside>
            </div>
          </main>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-4 text-xs text-slate-400 lg:px-8">
            <p>© 2025 Energy Tail. All rights reserved.</p>
            <p>Version 1.0.0</p>
          </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-400">{sub}</p>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="font-medium text-slate-700">{children}</span>
    </div>
  );
}
