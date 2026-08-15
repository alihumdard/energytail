"use client";

import Link from "next/link";
import {
  PublicHeader,
  DarkFooter,
  Avatar,
  Facebook,
  Linkedin,
  Twitter,
} from "@/components/Shared";
import {
  Bookmark,
  ChevronRight,
  Clock,
  Link2,
  Mail,
  Send,
  Share2,
  Zap,
  ArrowRight,
} from "lucide-react";

const related = [
  {
    img: "ph-ship",
    tag: "Industry News",
    tone: "bg-brand-50 text-brand-500",
    date: "May 14, 2025",
    title: "LNG Demand Continues to Rise Across Asia",
    read: "6 min read",
  },
  {
    img: "ph-ai",
    tag: "Technology",
    tone: "bg-emerald-50 text-emerald-600",
    date: "May 12, 2025",
    title: "How AI is Transforming Oil & Gas Operations",
    read: "7 min read",
  },
  {
    img: "ph-green",
    tag: "Sustainability",
    tone: "bg-emerald-50 text-emerald-600",
    date: "May 10, 2025",
    title: "Carbon Capture: The Future of Clean Energy",
    read: "5 min read",
  },
  {
    img: "ph-plant",
    tag: "Operations",
    tone: "bg-amber-50 text-amber-600",
    date: "May 8, 2025",
    title: "Improving Operational Efficiency in Refineries",
    read: "6 min read",
  },
];

const body = [
  {
    h: "1. Oil & Gas Demand Remains Resilient",
    p: "Despite the growth of renewables, oil and gas will continue to play a critical role in meeting global energy needs. Industrial growth, population increase, and emerging economies will drive demand, particularly in Asia and the Middle East.",
  },
  {
    h: "2. Supply Constraints & Geopolitical Risks",
    p: "OPEC+ production strategies, geopolitical tensions, and underinvestment in upstream projects could tighten supply. This may lead to price volatility and highlight the importance of energy security for importing nations.",
  },
  {
    h: "3. Energy Transition Accelerates",
    p: "Investment in renewables, hydrogen, and carbon capture technologies is set to accelerate. Companies that balance traditional energy with clean energy solutions will be best positioned for long-term success.",
  },
  {
    h: "4. Digitalization & AI Drive Efficiency",
    p: "AI, data analytics, and automation are transforming exploration, production, and operations. These technologies help reduce costs, improve safety, and lower environmental impact.",
  },
];

const tags = ["Oil & Gas", "Energy Market", "2025 Outlook", "Renewable Energy", "Investment"];

export default function ArticleDetailsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader active="Articles" user="Jsmmith" role="Job Seeker" />

      <div className="mx-auto max-w-[1280px] px-4 py-7 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-500">
          <Link href="/" className="hover:text-brand-500">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/articles" className="hover:text-brand-500">
            Articles
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <a href="/articles" className="underline decoration-ink-300 underline-offset-2">
            Market Insights
          </a>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink-700 underline decoration-ink-300 underline-offset-2">
            Energy Market Outlook 2025: Key Trends to Watch
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          {/* Article */}
          <article>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-[12px] text-ink-500">
              <span className="chip bg-brand-50 text-brand-500">Market Insights</span>
              <span>· May 15, 2025</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> 8 min read
              </span>
            </div>

            <h1 className="max-w-3xl text-[30px] font-extrabold leading-[1.2] tracking-tight sm:text-[38px]">
              Energy Market Outlook 2025: Key Trends to Watch
            </h1>
            <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-ink-700">
              Expert insights on market trends, supply demand dynamics, and investment opportunities
              shaping the global oil, gas and energy sector in 2025 and beyond.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5">
                <Avatar size={40} />
                <span className="leading-tight">
                  <span className="block text-[13px] font-bold">Robert Taylor</span>
                  <span className="block text-[11.5px] text-ink-500">Market Analyst</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 sm:ml-auto">
                <button className="btn h-10 border border-[#dfe6f1] text-ink-700 hover:bg-slate-50">
                  <Bookmark className="h-4 w-4" /> Save
                </button>
                <button className="btn h-10 border border-[#dfe6f1] text-ink-700 hover:bg-slate-50">
                  <Share2 className="h-4 w-4" /> Share
                </button>
                {[Linkedin, Twitter, Facebook, Link2].map((Icon, i) => (
                  <button
                    key={i}
                    className="grid h-10 w-10 place-items-center rounded-lg border border-[#dfe6f1] text-ink-700 hover:border-brand-500 hover:text-brand-500"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="ph ph-rig mt-7 h-[250px] rounded-xl sm:h-[300px] lg:h-[330px]" />

            <p className="mt-7 text-[13.5px] leading-[1.85] text-ink-700">
              The global energy market is entering a transformative phase in 2025, shaped by evolving
              geopolitics, technological advancements, and the accelerating energy transition. As we
              look ahead, several key trends are set to define the oil, gas, and broader energy
              landscape.
            </p>

            {body.map((b) => (
              <section key={b.h} className="mt-7">
                <h2 className="mb-2.5 text-[16px] font-extrabold">{b.h}</h2>
                <p className="text-[13.5px] leading-[1.85] text-ink-700">{b.p}</p>
              </section>
            ))}

            <div className="mt-8 flex gap-3.5 rounded-xl bg-[#f2f7ff] p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
                <Zap className="h-4 w-4" />
              </span>
              <div>
                <p className="mb-1 text-[13.5px] font-extrabold">Key Takeaway</p>
                <p className="text-[13px] leading-relaxed text-ink-700">
                  The energy sector in 2025 will be defined by resilience, innovation, and
                  adaptability. Organizations that embrace change and invest strategically will lead
                  the future.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2.5 border-t border-[#eef2f7] pt-6">
              <span className="text-[13px] font-bold">Tags:</span>
              {tags.map((t) => (
                <span key={t} className="chip bg-brand-50 text-brand-500">
                  {t}
                </span>
              ))}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-5">
            <section className="card p-5">
              <h3 className="mb-4 text-[15px] font-bold">About the Author</h3>
              <div className="flex items-start gap-3">
                <Avatar size={44} />
                <div className="leading-tight">
                  <p className="text-[13.5px] font-bold">Robert Taylor</p>
                  <p className="mt-1 text-[12px] text-ink-500">Market Analyst</p>
                </div>
                <a
                  href="/articles"
                  className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-[#dfe6f1] text-brand-500 hover:bg-brand-50"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-4 text-[12.5px] leading-relaxed text-ink-500">
                Energy market analyst with 10+ years of experience covering oil, gas, and renewable
                energy trends.
              </p>
              <div className="mt-5 grid grid-cols-2 divide-x divide-[#eef2f7] border-t border-[#eef2f7] pt-4 text-center">
                <div>
                  <p className="text-[17px] font-extrabold">128</p>
                  <p className="text-[11.5px] text-ink-500">Articles</p>
                </div>
                <div>
                  <p className="text-[17px] font-extrabold">12.5K</p>
                  <p className="text-[11.5px] text-ink-500">Followers</p>
                </div>
              </div>
            </section>

            <section className="card p-5">
              <h3 className="mb-4 text-[15px] font-bold">Related Articles</h3>
              <div className="space-y-4">
                {related.map((r) => (
                  <Link href="/article-details" key={r.title} className="group flex gap-3">
                    <span className={`ph ${r.img} h-[68px] w-[76px] shrink-0 rounded-lg`} />
                    <span className="min-w-0">
                      <span className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className={`chip ${r.tone}`}>{r.tag}</span>
                        <span className="text-[11px] text-ink-500">{r.date}</span>
                      </span>
                      <span className="block text-[13px] font-bold leading-snug group-hover:text-brand-500">
                        {r.title}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-500">
                        <Clock className="h-3 w-3" /> {r.read}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                href="/articles"
                className="mt-5 flex h-11 items-center justify-center gap-2 rounded-lg border border-[#dfe6f1] text-[13px] font-semibold text-brand-500 hover:bg-brand-50"
              >
                View All Articles <ArrowRight className="h-4 w-4" />
              </Link>
            </section>

            <section className="relative overflow-hidden rounded-xl bg-[#eff5ff] p-5">
              <h3 className="text-[15px] font-bold">Stay Updated</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
                Get the latest energy insights and industry news delivered to your inbox.
              </p>
              <div className="mt-4 flex">
                <input
                  className="h-11 w-full rounded-l-lg border border-r-0 border-[#dbe4f2] bg-white px-3.5 text-[12.5px] outline-none focus:border-brand-500"
                  placeholder="Enter your email"
                />
                <button className="grid h-11 w-12 shrink-0 place-items-center rounded-r-lg bg-brand-500 text-white hover:bg-brand-600">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-[11.5px] text-ink-500">No spam. Unsubscribe anytime.</p>
              <Mail className="pointer-events-none absolute -bottom-3 right-3 h-16 w-16 text-brand-500/15" />
            </section>
          </aside>
        </div>
      </div>

      <DarkFooter />
    </div>
  );
}
