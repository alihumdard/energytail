"use client";

import { useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { adminUsers } from "@/lib/api/endpoints";
import type { User } from "@/lib/api/types";

/** Roles an administrator may assign. Mirrors the API's own list. */
const ROLES = [
  { value: "job_seeker", label: "Job Seeker" },
  { value: "employer", label: "Employer" },
  { value: "author", label: "Article Author" },
  { value: "administrator", label: "Administrator" },
] as const;

interface Props {
  /** The user being edited, or null to create a new one. */
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function UserFormModal({ user, onClose, onSaved }: Props) {
  const editing = user !== null;

  /*
   * Widened to plain strings: these are bound to <select> and <input>, whose
   * values arrive as strings, and the API validates them anyway. Keeping the
   * narrow union here would mean casting on every change handler.
   */
  const [form, setForm] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
    status: string;
    email_verified: boolean;
  }>({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    password: "",
    role: user?.roles[0] ?? "job_seeker",
    status: user?.status ?? "active",
    email_verified: user?.email_verified ?? false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  function update<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        email_verified: form.email_verified,
      };

      if (editing) {
        await adminUsers.update(user.id, payload);
      } else {
        // Create-only fields, matching the form above.
        payload.status = form.status;

        // Optional: left blank, the API sets a random password and the user
        // arrives through the reset flow.
        if (form.password !== "") {
          payload.password = form.password;
        }

        await adminUsers.create(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err
          : new ApiError(0, "Could not reach the server."),
      );
      setSaving(false);
    }
  }

  // Fields with their own error slot; anything else falls through to the
  // banner so a failure is never silent.
  const INLINE = ["first_name", "last_name", "email", "password", "role", "status"];
  const hasInline = INLINE.some((field) => error?.fieldError(field));
  const generalError = error && !hasInline ? error.detail : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Edit user" : "Add user"}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            {editing ? "Edit User" : "Add New User"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
          {generalError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {generalError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="First Name"
              required
              value={form.first_name}
              onChange={(v) => update("first_name", v)}
              error={error?.fieldError("first_name")}
            />
            <Field
              label="Last Name"
              required
              value={form.last_name}
              onChange={(v) => update("last_name", v)}
              error={error?.fieldError("last_name")}
            />
          </div>

          <Field
            label="Email Address"
            type="email"
            required
            value={form.email}
            onChange={(v) => update("email", v)}
            error={error?.fieldError("email")}
          />

          <Field
            label="Phone"
            value={form.phone}
            onChange={(v) => update("phone", v)}
            error={error?.fieldError("phone")}
          />

          {/*
            Password and status appear on create only.

            The API refuses both on update, by design. A password set by an
            administrator is a credential the account owner never chose, so
            changing it runs through the reset flow instead; and suspending
            runs through its own endpoint, which records a reason and refuses
            to strand the last administrator. Offering either here would be a
            control that silently did nothing.
          */}
          {!editing && (
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => update("password", v)}
              error={error?.fieldError("password")}
              hint="Leave blank to send the user a reset link instead."
            />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="role" className="text-sm font-medium text-slate-700">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {error?.fieldError("role") && (
                <p className="mt-1 text-xs text-red-600">{error.fieldError("role")}</p>
              )}
            </div>

            {!editing && (
              <div>
                <label htmlFor="status" className="text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
                {error?.fieldError("status") && (
                  <p className="mt-1 text-xs text-red-600">{error.fieldError("status")}</p>
                )}
              </div>
            )}
          </div>

          {editing && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              To change this user&apos;s password, send them a reset link from
              their details. To suspend them, use the button on their row.
            </p>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.email_verified}
              onChange={(e) => update("email_verified", e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Mark email as already verified
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}
