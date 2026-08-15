import { Briefcase, Building2, ClipboardList, Bell, User, Mail, Lock, Eye, UserPlus, ShieldCheck, BadgeCheck, TrendingUp, Building, Lock as LockIcon } from "lucide-react";
import Header from "@/components/Header";
import { DarkFooter } from "@/components/Shared";
import Breadcrumb from "@/components/Breadcrumb";
import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Divider from "@/components/ui/Divider";
import SocialAuthButtons from "@/components/ui/SocialAuthButtons";
import InfoBanner from "@/components/ui/InfoBanner";
import { GoogleIcon, LinkedinIcon, FacebookIcon } from "@/components/SocialIcons";

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

const accountTypes = [
  { icon: User, title: "Job Seeker", desc: "I want to find a job", selected: true },
  { icon: Building, title: "Employer", desc: "I want to hire talent", selected: false },
  { icon: ClipboardList, title: "Article Author", desc: "I want to write articles", selected: false },
];

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

            <form className="mt-6 space-y-5">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="First Name"
                    required
                    placeholder="Enter your first name"
                    icon={User}
                  />
                  <FormField
                    label="Last Name"
                    required
                    placeholder="Enter your last name"
                    icon={User}
                  />
                </div>
              </div>

              <FormField
                label="Email Address"
                required
                type="email"
                placeholder="Enter your email address"
                icon={Mail}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Password"
                  required
                  type="password"
                  placeholder="Create a password"
                  icon={Lock}
                  paddingClass="pr-9 py-2.5"
                  trailing={
                    <Eye className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" />
                  }
                />
                <FormField
                  label="Confirm Password"
                  required
                  type="password"
                  placeholder="Confirm your password"
                  icon={Lock}
                  paddingClass="pr-9 py-2.5"
                  trailing={
                    <Eye className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" />
                  }
                />
              </div>
              <p className="text-xs text-slate-400 -mt-3">
                Password must be at least 8 characters with uppercase, lowercase, number &amp; special character.
              </p>

              <div>
                <h3 className="font-semibold text-slate-800 text-sm mb-1">Account Type</h3>
                <label className="text-sm text-slate-700 font-medium">
                  Join as <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  {accountTypes.map((a) => (
                    <button
                      type="button"
                      key={a.title}
                      className={`text-left rounded-xl border p-4 transition ${
                        a.selected
                          ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <a.icon className={`w-6 h-6 ${a.selected ? "text-blue-600" : "text-slate-400"}`} />
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            a.selected ? "border-blue-600" : "border-slate-300"
                          }`}
                        >
                          {a.selected && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                        </span>
                      </div>
                      <div className="font-semibold text-sm text-slate-800 mt-3">{a.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{a.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span>
                  I agree to the{" "}
                  <a href="/register" className="text-blue-600 hover:underline">
                    Terms of Use
                  </a>{" "}
                  and{" "}
                  <a href="/register" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>

              <PrimaryButton type="submit" icon={<UserPlus className="w-4 h-4" />}>
                Create Account
              </PrimaryButton>

              <Divider label="or register with" />

              <SocialAuthButtons
                providers={[
                  { label: "Google", icon: GoogleIcon },
                  { label: "LinkedIn", icon: LinkedinIcon, iconClassName: "text-[#0A66C2]" },
                  { label: "Facebook", icon: FacebookIcon, iconClassName: "text-[#1877F2]" },
                ]}
                columns={3}
              />
            </form>
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

