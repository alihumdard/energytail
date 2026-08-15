import { Mail, CheckCircle2, Clock, RefreshCw, Pencil, HelpCircle, Send, ShieldCheck, UserCheck, Lock, Bell, Headphones } from "lucide-react";
import Header from "@/components/Header";
import { DarkFooter } from "@/components/Shared";
import Breadcrumb from "@/components/Breadcrumb";
import PrimaryButton from "@/components/ui/PrimaryButton";
import InfoBanner from "@/components/ui/InfoBanner";

const helpItems = [
  { icon: Clock, title: "Check your spam folder", desc: "Sometimes our emails end up in spam/junk." },
  { icon: RefreshCw, title: "Resend verification email", desc: "Click the button below to resend the email." },
  { icon: Pencil, title: "Incorrect email address?", desc: "Update your email address and we will resend." },
  { icon: HelpCircle, title: "Still having trouble?", desc: "Contact our support team for further assistance." },
];

const whyVerify = [
  { icon: ShieldCheck, title: "Secure Account", desc: "Protects your account from unauthorized access." },
  { icon: UserCheck, title: "Verify Your Identity", desc: "Confirms your identity and valid email address." },
  { icon: Lock, title: "Access All Features", desc: "Get full access to all features after verification." },
  { icon: Bell, title: "Important Updates", desc: "Receive important job alerts and updates." },
];

export default function VerifyEmailPage() {
  return (
    <>
      <Header />
      <Breadcrumb current="Email Verification" />

      <main className="mx-auto max-w-3xl px-4 pb-14 flex-1 w-full">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col items-center text-center">
          <div className="relative w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6">
            <Mail className="w-10 h-10 text-blue-600" />
            <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-white">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Verify Your Email Address</h1>
          <p className="text-sm text-slate-500 mt-3 max-w-md">
            We&apos;ve sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </p>

          <div className="mt-6 w-full max-w-md flex items-center justify-between gap-3 bg-slate-50 rounded-lg px-4 py-3.5">
            <div className="flex items-center gap-2.5 text-left">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <div className="text-xs text-slate-500">Email sent to</div>
                <div className="text-sm font-semibold text-slate-800">john.anderson@example.com</div>
              </div>
            </div>
            <a href="/register" className="text-sm text-blue-600 font-medium hover:underline shrink-0">
              Change Email
            </a>
          </div>

          <div className="w-full flex items-center gap-3 text-xs text-slate-400 my-8">
            <div className="flex-1 h-px bg-slate-200" />
            Didn&apos;t receive the email?
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full">
            {helpItems.map((h) => (
              <div key={h.title} className="flex flex-col items-center text-center gap-2">
                <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center">
                  <h.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-xs font-semibold text-slate-800">{h.title}</div>
                <div className="text-[11px] text-slate-500 leading-relaxed">{h.desc}</div>
              </div>
            ))}
          </div>

          <PrimaryButton type="button" className="mt-8 max-w-md" icon={<Send className="w-4 h-4" />}>
            Resend Verification Email
          </PrimaryButton>

          <p className="text-xs text-slate-400 mt-4 max-w-md">
            The verification link will expire in 24 hours for security reasons.
            <br />
            If you&apos;re still having trouble,{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              contact our support team
            </a>
            .
          </p>
        </div>

        {/* Why verify */}
        <section className="mt-8 bg-slate-50 border border-slate-100 rounded-2xl p-8 sm:p-10">
          <h2 className="text-xl font-bold text-slate-900 text-center">Why do we verify your email?</h2>
          <p className="text-sm text-slate-500 text-center mt-1">
            Email verification helps us keep your account secure and verified.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
            {whyVerify.map((w) => (
              <div key={w.title} className="text-center flex flex-col items-center">
                <w.icon className="w-7 h-7 text-blue-600 mb-3" />
                <div className="font-semibold text-slate-800 text-sm">{w.title}</div>
                <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">{w.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Need help */}
        <InfoBanner
          className="mt-6 bg-emerald-50 border border-emerald-100 px-6 sm:px-8 py-5"
          iconWrapClass="bg-emerald-600"
          icon={<Headphones className="w-5 h-5 text-white" />}
          title="Need Help?"
          desc="Our support team is here to help you with any issues."
          action={
            <button className="flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-emerald-100 shrink-0">
              <Headphones className="w-4 h-4" />
              Contact Support
            </button>
          }
        />
      </main>

      <DarkFooter />
    </>
  );
}
