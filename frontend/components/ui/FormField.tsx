import type { ComponentType, InputHTMLAttributes, ReactNode } from "react";

interface FormFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  required?: boolean;
  icon?: ComponentType<{ className?: string }>;
  trailing?: ReactNode;
  paddingClass?: string;
  /** Server-side validation message, rendered under the input. */
  error?: string;
}

export default function FormField({
  label,
  required,
  type = "text",
  icon: Icon,
  trailing,
  paddingClass = "pr-3 py-2.5",
  error,
  id,
  name,
  ...inputProps
}: FormFieldProps) {
  // Falls back to the field name so the label stays clickable and screen
  // readers can associate the two.
  const inputId = id ?? name;

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="text-sm text-slate-700 font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative mt-1.5">
        {Icon && (
          <Icon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        )}
        <input
          {...inputProps}
          id={inputId}
          name={name}
          type={type}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          className={`w-full border rounded-lg pl-9 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 ${paddingClass} ${
            error
              ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
              : "border-slate-200 focus:ring-blue-500/30 focus:border-blue-500"
          }`}
        />
        {trailing}
      </div>
      {error && (
        <p id={inputId ? `${inputId}-error` : undefined} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
