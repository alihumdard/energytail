import { MailIcon, Clock, ShieldCheck, Mail, Send, Info, Headphones, Lock, UserCheck } from "lucide-react";
import Header from "@/components/Header";
import { DarkFooter } from "@/components/Shared";
import Breadcrumb from "@/components/Breadcrumb";
import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Divider from "@/components/ui/Divider";
import InfoBanner from "@/components/ui/InfoBanner";

const perks = [
  { icon: MailIcon, title: "Secure & Safe", desc: "We use industry-standard security to protect your account." },
  { icon: Clock, title: "Quick & Easy", desc: "Reset your password in just a few simple steps." },
  { icon: ShieldCheck, title: "Account Protection", desc: "Keep your account secure and update your password regularly." },
];

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <Breadcrumb current="Forgot Password" />

      <main className="mx-auto max-w-7xl px-4 pb-14 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-xl border border-slate-100">
          {/* Left panel */}
          <AuthLeftPanel
            title="Reset Your Password"
            subtitle="No worries! Enter your email address and we'll send you instructions to reset your password."
            perks={perks}
            showDivider
          />

          {/* Right panel */}
          <div className="bg-white p-8 sm:p-10 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-5">
              <Lock className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Forgot Password?</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">
              Enter your registered email address and we will send you a link to reset your password.
            </p>

            <form className="mt-6 w-full max-w-sm space-y-4 text-left">
              <FormField
                label="Email Address"
                type="email"
                placeholder="Enter your registered email address"
                icon={Mail}
              />

              <PrimaryButton type="submit" icon={<Send className="w-4 h-4" />}>
                Send Reset Link
              </PrimaryButton>

              <Divider label="or" />

              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3.5">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-slate-800">Check your inbox</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    We&apos;ll send password reset instructions to your email. Don&apos;t forget to check your spam or junk folder.
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-slate-500">
                Remember your password?{" "}
                <a href="/login" className="text-blue-600 font-medium hover:underline">
                  Login Now
                </a>
              </p>
            </form>
          </div>
        </div>

        {/* Need help */}
        <InfoBanner
          iconVariant="plain"
          className="mt-8 border border-slate-100 p-6"
          icon={<Headphones className="w-5 h-5 text-blue-600" />}
          title="Need Help?"
          desc="If you're having trouble accessing your account, our support team is here to help."
          action={
            <button className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 shrink-0">
              <Headphones className="w-4 h-4" />
              Contact Support
            </button>
          }
        />

        {/* Security */}
        <section className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">Your security is our priority</div>
              <div className="text-xs text-slate-500 mt-0.5">
                We never share your information with third parties. All data is encrypted and securely stored.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 gap-y-4 sm:gap-8 shrink-0">
            <div className="flex flex-col items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Lock className="w-5 h-5 text-blue-600" />
              SSL Encrypted
            </div>
            <div className="flex flex-col items-center gap-1.5 text-xs text-slate-600 font-medium">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Secure Authentication
            </div>
            <div className="flex flex-col items-center gap-1.5 text-xs text-slate-600 font-medium">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Privacy Protected
            </div>
          </div>
        </section>
      </main>

      <DarkFooter />
    </>
  );
}
