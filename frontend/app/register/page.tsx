import { Suspense } from "react";
import { Briefcase, Building2, ClipboardList, Bell, ShieldCheck, BadgeCheck, TrendingUp, Lock as LockIcon } from "lucide-react";
import Header from "@/components/Header";
import { DarkFooter } from "@/components/Shared";
import Breadcrumb from "@/components/Breadcrumb";
import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
import RegisterForm from "@/components/auth/RegisterForm";
import InfoBanner from "@/components/ui/InfoBanner";

const perks = [
  {
    icon: Briefcase,
    title: "Find the Right Opportunities",
    desc: "Search and apply for the best jobs from top energy companies.",
  },
  {
    icon: Building2,
    title: "Connect with Top Employers",
    desc: "Build your profile and get noticed by leading companies hiring now.",
  },
  {
    icon: ClipboardList,
    title: "Manage Applications",
    desc: "Track your applications and stay updated on your job status.",
  },
  {
    icon: Bell,
    title: "Get Notified",
    desc: "Receive instant alerts for new jobs and important updates.",
  },
];

// Account types moved into RegisterForm, where the selection is stateful and
// its values have to match the roles the API accepts.

const whyJoin = [
  { icon: BadgeCheck, title: "Trusted by Top Companies", desc: "Connect with leading oil, gas & energy companies worldwide." },
  { icon: ShieldCheck, title: "Verified Opportunities", desc: "Access verified jobs and opportunities from trusted employers." },
  { icon: LockIcon, title: "Safe & Secure", desc: "Your data is protected with industry-standard security measures." },
  { icon: TrendingUp, title: "Career Growth", desc: "Enhance your career with the best opportunities in the energy sector." },
];

export default function RegisterPage() {
  return (
    <>
      <Header />
      <Breadcrumb current="Register" />

      <main className="mx-auto max-w-7xl px-4 pb-14 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-xl border border-slate-100">
          {/* Left panel */}
          <AuthLeftPanel
            title="Create Your Account"
            subtitle="Join Energy Tail and unlock thousands of oil, gas &amp; energy opportunities worldwide."
            perks={perks}
            minHeight="min-h-[600px]"
            showDivider
            illustrationHeight="h-40"
          />

          {/* Right panel */}
          <div className="bg-white p-8 sm:p-10">
            <h2 className="text-2xl font-bold text-slate-900">Register for a New Account</h2>
            <p className="text-sm text-slate-500 mt-1">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 font-medium hover:underline">
                Login
              </a>
            </p>

            {/* The form reads ?role= to preselect an account type, and
                useSearchParams needs a boundary to suspend against during
                prerender. */}
            <Suspense fallback={null}>
              <RegisterForm />
            </Suspense>
          </div>
        </div>

        {/* Why join */}
        <section className="mt-10 bg-slate-50 border border-slate-100 rounded-2xl p-8 sm:p-10">
          <h2 className="text-xl font-bold text-slate-900 text-center">Why Join Energy Tail?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
            {whyJoin.map((w) => (
              <div key={w.title} className="text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-3">
                  <w.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="font-semibold text-slate-800 text-sm">{w.title}</div>
                <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">{w.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy banner */}
        <InfoBanner
          className="mt-6 bg-blue-50 border border-blue-100 px-6 sm:px-8 py-5"
          icon={<ShieldCheck className="w-5 h-5 text-white" />}
          title="Your privacy is important to us"
          desc="We will never share your personal information with third parties."
          action={
            <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
              <LockIcon className="w-4 h-4 text-blue-600" />
              <div>
                Secure Registration
                <div className="text-xs text-slate-500 font-normal">SSL Encrypted</div>
              </div>
            </div>
          }
        />
      </main>

      <DarkFooter />
    </>
  );
}

