import type { ComponentType, ReactNode } from "react";

interface FormFieldProps {
  label?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  icon?: ComponentType<{ className?: string }>;
  trailing?: ReactNode;
  paddingClass?: string;
}

export default function FormField({
  label,
  required,
  type = "text",
  placeholder,
  icon: Icon,
  trailing,
  paddingClass = "pr-3 py-2.5",
}: FormFieldProps) {
  return (
    <div>
      {label && (
        <label className="text-sm text-slate-700 font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative mt-1.5">
        {Icon && <Icon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />}
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full border border-slate-200 rounded-lg pl-9 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${paddingClass}`}
        />
        {trailing}
      </div>
    </div>
  );
}
