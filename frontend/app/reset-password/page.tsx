import { Mail, ArrowRight, ShieldCheck } from "lucide-react";
import HeaderAlt from "@/components/HeaderAlt";
import { DarkFooter } from "@/components/Shared";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Divider from "@/components/ui/Divider";
import { GoogleIcon } from "@/components/SocialIcons";

const steps = [
  { n: 1, label: "Request" },
  { n: 2, label: "Verify Email" },
  { n: 3, label: "Reset Password" },
];

export default function ResetPasswordPage() {
  return (
    <>
      <HeaderAlt />

      <main className="flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left illustration panel */}
          <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 px-8 sm:px-16 py-16 flex flex-col justify-center min-h-[520px] overflow-hidden">
            <div className="absolute top-10 right-10 w-2 h-2 rounded-full bg-blue-200" />
            <div className="absolute top-16 right-16 w-2 h-2 rounded-full bg-blue-200" />
            <div className="absolute bottom-16 left-10 w-2 h-2 rounded-full bg-blue-200" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 max-w-sm">
              Reset Your Password
            </h1>
            <p className="text-slate-500 mt-4 max-w-sm leading-relaxed">
              No worries! It happens. Enter your registered email address and we&apos;ll send you a link to reset your password.
            </p>

            <div className="relative mt-14 w-full max-w-xs h-52">
              <svg viewBox="0 0 300 220" className="w-full h-full">
                <circle cx="150" cy="110" r="95" fill="#dbeafe" opacity="0.6" />
                <rect x="55" y="90" width="90" height="75" rx="10" fill="#3b82f6" />
                <path d="M70 90 v-25 a25 25 0 0 1 50 -12" stroke="#3b82f6" strokeWidth="12" fill="none" strokeLinecap="round" />
                <circle cx="100" cy="122" r="8" fill="#1d4ed8" />
                <rect x="96" y="122" width="8" height="16" rx="3" fill="#1d4ed8" />
                <g transform="translate(120,95)">
                  <rect x="0" y="20" width="110" height="75" rx="6" fill="#ffffff" stroke="#93c5fd" strokeWidth="2" />
                  <path d="M0 22 L55 62 L110 22" stroke="#93c5fd" strokeWidth="2" fill="none" />
                  <circle cx="90" cy="30" r="13" fill="#22c55e" />
                  <path d="M20 5 L45 -20" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
                  <path d="M45 -20 l-14 2 l6 13 z" fill="#3b82f6" />
                </g>
              </svg>
            </div>
          </div>

          {/* Right form panel */}
          <div className="px-6 sm:px-16 py-14 flex flex-col justify-center">
            <div className="w-full max-w-md mx-auto">
              {/* Stepper */}
              <div className="flex items-center mb-8">
                {steps.map((s, i) => (
                  <div key={s.n} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          s.n === 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {s.n}
                      </div>
                      <span className={`text-xs font-medium whitespace-nowrap ${s.n === 1 ? "text-blue-600" : "text-slate-400"}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && <div className="flex-1 h-px bg-slate-200 mx-2 mb-5" />}
                  </div>
                ))}
              </div>

              <h2 className="text-2xl font-bold text-slate-900">Enter your email address</h2>
              <p className="text-sm text-slate-500 mt-2">We&apos;ll send you a password reset link to your email.</p>

              <form className="mt-6 space-y-4">
                <FormField
                  label="Email Address"
                  type="email"
                  placeholder="Enter your registered email"
                  icon={Mail}
                  paddingClass="pr-3 py-3"
                />

                <PrimaryButton type="submit" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                  Send Reset Link
                </PrimaryButton>

                <Divider label="OR" />

                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-lg py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <GoogleIcon className="w-4 h-4" />
                  Reset with Google
                </button>

                <p className="text-center text-sm text-slate-500">
                  Remember your password?{" "}
                  <a href="/login" className="text-blue-600 font-medium hover:underline">
                    Back to Login
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Secure & simple note */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div />
          <div className="px-6 sm:px-16 pb-14">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 sm:px-8 py-5 flex items-start gap-4 max-w-lg">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-sm">Secure &amp; Simple</div>
                <div className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                  We take your security seriously. Your password reset link will expire in 30 minutes for your protection.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <DarkFooter />
    </>
  );
}

