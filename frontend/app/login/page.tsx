import { Suspense } from "react";
import Link from "next/link";
import { Search, Building2, ClipboardList, ShieldCheck, Headphones, Briefcase } from "lucide-react";
import Header from "@/components/Header";
import { DarkFooter } from "@/components/Shared";
import Breadcrumb from "@/components/Breadcrumb";
import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
import LoginForm from "@/components/auth/LoginForm";
import InfoBanner from "@/components/ui/InfoBanner";

const perks = [
  {
    icon: Search,
    title: "Find the Right Job",
    desc: "Search and apply for the best oil, gas and energy jobs worldwide.",
  },
  {
    icon: Building2,
    title: "Connect with Top Companies",
    desc: "Explore leading energy companies hiring top talent like you.",
  },
  {
    icon: ClipboardList,
    title: "Track Applications",
    desc: "Manage your applications and get notified about updates.",
  },
];

export default function LoginPage() {
  return (
    <>
      <Header />
      <Breadcrumb current="Login" />

      <main className="mx-auto max-w-7xl px-4 pb-14 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-xl border border-slate-100">
          {/* Left panel */}
          <AuthLeftPanel
            title="Welcome Back!"
            subtitle="Login to your Energy Tail account and access thousands of jobs, companies and career resources."
            perks={perks}
          />

          {/* Right panel */}
          <div className="bg-white p-8 sm:p-10 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-slate-900">Login to Your Account</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your credentials to continue</p>

            {/*
              The form is a client component so the page around it stays
              server-rendered. Suspense is required because it reads search
              params for the post-login redirect.
            */}
            <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-lg bg-slate-50" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        {/* Secure login row */}
        <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border border-slate-100 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="font-semibold text-slate-800 text-sm">Secure Login</div>
              <div className="text-xs text-slate-500">We use industry-standard encryption to keep your data safe and secure.</div>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:justify-end">
            <Headphones className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-semibold text-slate-800 text-sm">Need Help?</div>
              <a href="/register" className="text-xs text-blue-600 hover:underline">Contact our support team</a>
            </div>
          </div>
        </section>

        {/* Employer banner */}
        <InfoBanner
          className="mt-6 bg-blue-50 border border-blue-100 px-6 sm:px-8 py-5"
          iconWrapClass="bg-blue-600"
          icon={<Briefcase className="w-5 h-5 text-white" />}
          title="Are you a company looking to hire?"
          desc="Post jobs, search resumes and connect with top energy professionals."
          action={
            <Link
              href="/register?role=employer"
              className="flex items-center gap-2 bg-white border border-blue-200 text-blue-600 font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-blue-100 shrink-0"
            >
              <Building2 className="w-4 h-4" />
              Register as Employer
            </Link>
          }
        />
      </main>

      <DarkFooter />
    </>
  );
}

