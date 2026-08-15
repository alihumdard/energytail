"use client";

import { useState } from "react";
import Shell from "@/components/admin/Shell";
import { PageHeader } from "@/components/admin/ShellUI";
import {
  Save,
  Settings as SettingsIcon,
  Mail,
  Monitor,
  UserCog,
  Bell,
  CreditCard,
  Search as SearchIcon,
  ShieldCheck,
  Cloud,
  Share2,
  Wrench,
  Upload,
  X,
  ChevronDown,
  Flame,
} from "lucide-react";

const settingsNav = [
  { key: "general", label: "General Settings", desc: "Basic site information and preferences", icon: SettingsIcon },
  { key: "email", label: "Email Settings", desc: "Configure email and SMTP settings", icon: Mail },
  { key: "site", label: "Site Settings", desc: "Manage site features and behavior", icon: Monitor },
  { key: "registration", label: "User & Registration", desc: "Control user registration and verification", icon: UserCog },
  { key: "notifications", label: "Notification Settings", desc: "Configure system notifications", icon: Bell },
  { key: "payment", label: "Payment Settings", desc: "Payment gateways and currency options", icon: CreditCard },
  { key: "seo", label: "SEO Settings", desc: "Meta tags and SEO related options", icon: SearchIcon },
  { key: "security", label: "Security Settings", desc: "Security, captcha and login settings", icon: ShieldCheck },
  { key: "storage", label: "Storage Settings", desc: "File storage and media settings", icon: Cloud },
  { key: "social", label: "Social Media", desc: "Social media links and integration", icon: Share2 },
  { key: "maintenance", label: "Maintenance Mode", desc: "Enable maintenance mode", icon: Wrench },
];

export default function SettingsPage() {
  const [active, setActive] = useState("general");
  const [toggles, setToggles] = useState({
    registration: true,
    verification: true,
    maintenance: false,
    recaptcha: true,
  });

  return (
    <Shell>
      <PageHeader
        title="System Settings"
        breadcrumb={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Settings" }]}
        description="Manage and configure global settings for the platform."
        actions={
          <button className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700">
            <Save size={15} />
            Save Changes
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        {/* Settings nav */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-card lg:sticky lg:top-20 lg:h-fit">
          <p className="px-2 pb-2 pt-1 text-[13px] font-semibold text-gray-900">
            Settings
          </p>
          <ul className="space-y-1">
            {settingsNav.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => setActive(item.key)}
                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      isActive ? "bg-brand-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <Icon
                      size={17}
                      className={`mt-0.5 shrink-0 ${isActive ? "text-brand-600" : "text-gray-400"}`}
                    />
                    <span>
                      <span
                        className={`block text-[13.5px] font-medium ${isActive ? "text-brand-700" : "text-gray-800"}`}
                      >
                        {item.label}
                      </span>
                      <span className="block text-[12px] text-gray-400">
                        {item.desc}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Panel */}
        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-card sm:p-6">
          {active === "general" ? (
            <>
              <h2 className="text-[16px] font-semibold text-gray-900">
                General Settings
              </h2>
              <p className="mb-6 mt-1 text-[13px] text-gray-500">
                Update the basic information about your platform.
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Site Name">
                  <input className="input" defaultValue="Energy Tail" />
                </Field>
                <Field label="Site Tagline">
                  <input
                    className="input"
                    defaultValue="Oil, Gas & Energy Jobs Portal"
                  />
                </Field>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Site Logo">
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                    <span className="relative flex items-center gap-2 rounded-md border border-gray-100 px-3 py-2">
                      <img src="/logo.png" alt="Energy Tail" className="h-8 w-auto object-contain" />
                      <button className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400">
                        <X size={10} />
                      </button>
                    </span>
                  </div>
                  <button className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:text-brand-700">
                    <Upload size={14} />
                    Upload Logo
                  </button>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Recommended size: 250x60px. PNG or SVG
                  </p>
                </Field>

                <Field label="Favicon">
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-md bg-brand-600 text-white">
                      <Flame size={16} fill="white" strokeWidth={0} />
                      <button className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400">
                        <X size={10} />
                      </button>
                    </span>
                  </div>
                  <button className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:text-brand-700">
                    <Upload size={14} />
                    Upload Favicon
                  </button>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Recommended size: 32x32px. ICO, PNG or SVG
                  </p>
                </Field>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Default Language">
                  <SelectField options={["English", "Urdu", "Arabic"]} />
                </Field>
                <Field label="Default Timezone">
                  <SelectField
                    options={["(UTC+05:00) Asia/Karachi", "(UTC+00:00) UTC", "(UTC-05:00) America/New York"]}
                  />
                </Field>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Date Format">
                  <SelectField options={["May 21, 2025", "21/05/2025", "2025-05-21"]} />
                </Field>
                <Field label="Time Format">
                  <SelectField options={["12 Hours (01:30 PM)", "24 Hours (13:30)"]} />
                </Field>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Copyright Text">
                  <input
                    className="input"
                    defaultValue="© 2025 Energy Tail. All rights reserved."
                  />
                </Field>
                <Field label="Footer Text">
                  <input
                    className="input"
                    defaultValue="Connecting Talent. Powering Energy."
                  />
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Site Description">
                  <div className="relative">
                    <textarea
                      className="input min-h-[90px] resize-none"
                      maxLength={255}
                      defaultValue="Energy Tail is a specialized platform for Oil, Gas and Energy industry jobs, connecting top talent with leading companies worldwide."
                    />
                    <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-gray-400">
                      126/255
                    </span>
                  </div>
                </Field>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                <ToggleRow
                  label="Enable Registration"
                  desc="Allow new users to register"
                  checked={toggles.registration}
                  onChange={() =>
                    setToggles((t) => ({ ...t, registration: !t.registration }))
                  }
                />
                <ToggleRow
                  label="Email Verification"
                  desc="Require email verification"
                  checked={toggles.verification}
                  onChange={() =>
                    setToggles((t) => ({ ...t, verification: !t.verification }))
                  }
                />
                <ToggleRow
                  label="Maintenance Mode"
                  desc="Site under maintenance"
                  checked={toggles.maintenance}
                  onChange={() =>
                    setToggles((t) => ({ ...t, maintenance: !t.maintenance }))
                  }
                />
                <ToggleRow
                  label="Google reCAPTCHA"
                  desc="Enable reCAPTCHA"
                  checked={toggles.recaptcha}
                  onChange={() =>
                    setToggles((t) => ({ ...t, recaptcha: !t.recaptcha }))
                  }
                />
              </div>
            </>
          ) : (
            <EmptyPanel
              label={settingsNav.find((s) => s.key === active)?.label ?? ""}
            />
          )}
        </div>
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-gray-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectField({ options }: { options: string[] }) {
  return (
    <div className="relative">
      <select className="input appearance-none pr-8">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 p-3.5">
      <span>
        <span className="block text-[13.5px] font-medium text-gray-900">
          {label}
        </span>
        <span className="block text-[12px] text-gray-400">{desc}</span>
      </span>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-brand-600" : "bg-gray-200"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-16 text-center">
      <SettingsIcon size={28} className="mb-3 text-gray-300" />
      <p className="text-[14px] font-medium text-gray-700">{label}</p>
      <p className="mt-1 max-w-xs text-[13px] text-gray-400">
        This section is ready to be configured. Switch back to General
        Settings to see the full example layout.
      </p>
    </div>
  );
}
