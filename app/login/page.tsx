import { Search, Building2, ClipboardList, Mail, Lock, LogIn, ShieldCheck, Headphones, Briefcase } from "lucide-react";
import Header from "@/components/Header";
import { DarkFooter } from "@/components/Shared";
import Breadcrumb from "@/components/Breadcrumb";
import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Divider from "@/components/ui/Divider";
import SocialAuthButtons from "@/components/ui/SocialAuthButtons";
import InfoBanner from "@/components/ui/InfoBanner";
import { GoogleIcon, LinkedinIcon, FacebookIcon, AppleIcon } from "@/components/SocialIcons";

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

            <form className="mt-6 space-y-5">
              <FormField
                label="Email Address"
                type="email"
                placeholder="Enter your email address"
                icon={Mail}
              />

              <FormField
                label="Password"
                type="password"
                placeholder="Enter your password"
                icon={Lock}
                paddingClass="pr-14 py-2.5"
                trailing={
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-medium">
                    Show
                  </button>
                }
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  Remember me
                </label>
                <a href="/forgot-password" className="text-blue-600 font-medium hover:underline">
                  Forgot Password?
                </a>
              </div>

              <PrimaryButton type="submit" icon={<LogIn className="w-4 h-4" />}>
                Login
              </PrimaryButton>

              <Divider label="or continue with" />

              <SocialAuthButtons
                providers={[
                  { label: "Google", icon: GoogleIcon },
                  { label: "LinkedIn", icon: LinkedinIcon, iconClassName: "text-[#0A66C2]" },
                  { label: "Facebook", icon: FacebookIcon, iconClassName: "text-[#1877F2]" },
                  { label: "Apple", icon: AppleIcon },
                ]}
                columns={2}
              />

              <p className="text-center text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <a href="/register" className="text-blue-600 font-medium hover:underline">
                  Register Now
                </a>
              </p>
            </form>
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
            <button className="flex items-center gap-2 bg-white border border-blue-200 text-blue-600 font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-blue-100 shrink-0">
              <Building2 className="w-4 h-4" />
              Register as Employer
            </button>
          }
        />
      </main>

      <DarkFooter />
    </>
  );
}

