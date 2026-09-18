"use client";

import { useState } from "react";
import { KeyRound, Loader2, Trash2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { adminUsers } from "@/lib/api/endpoints";
import type { User } from "@/lib/api/types";

interface Props {
  user: User;
  onClose: () => void;
  onEdit: () => void;
  /** Called after a delete, so the list can drop the row. */
  onChanged: () => void;
}

export default function UserDetailModal({ user, onClose, onEdit, onChanged }: Props) {
  const [busy, setBusy] = useState<"reset" | "delete" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function sendReset() {
    setBusy("reset");
    setMessage(null);

    try {
      const response = await adminUsers.sendPasswordReset(user.id);
      setMessage({ ok: true, text: response.message });
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof ApiError ? err.message : "Could not send the email.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("delete");
    setMessage(null);

    try {
      await adminUsers.remove(user.id);
      onChanged();
      onClose();
    } catch (err) {
      // The API refuses some deletes — the last administrator, or your own
      // account — and the reason is worth showing rather than swallowing.
      setMessage({
        ok: false,
        text: err instanceof ApiError ? err.message : "Could not delete this user.",
      });
      setBusy(null);
      setConfirmingDelete(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="User details"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">User Details</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
              {/* Both are nullable on social sign-ups, where the provider may
                  return only a display name. */}
              {initials(user)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{user.full_name}</p>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
            <Row label="Role" value={user.roles.join(", ") || "—"} />
            <Row label="Status" value={user.status} />
            <Row label="Phone" value={user.phone || "—"} />
            <Row label="Email verified" value={user.email_verified ? "Yes" : "No"} />
            <Row label="Joined" value={formatDate(user.created_at)} />
            <Row label="Last sign-in" value={formatDate(user.last_login_at) || "Never"} />
          </dl>

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Permissions ({user.permissions.length})
            </p>
            {user.permissions.length === 0 ? (
              <p className="text-sm text-slate-400">None.</p>
            ) : (
              <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                {user.permissions.map((p) => (
                  <span
                    key={p}
                    className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          {message && (
            <p
              className={`text-sm ${message.ok ? "text-emerald-600" : "text-red-600"}`}
              role="alert"
            >
              {message.text}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            onClick={sendReset}
            disabled={busy !== null}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            {busy === "reset" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Send password reset
          </button>

          {confirmingDelete ? (
            <>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={remove}
                disabled={busy !== null}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy === "delete" && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm delete
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}

          <button
            onClick={onEdit}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium capitalize text-slate-800">{value}</dd>
    </div>
  );
}

/** Falls back to the full name, then to a dash, so the avatar is never blank. */
function initials(user: User): string {
  const letters = [user.first_name, user.last_name]
    .map((part) => part?.trim().charAt(0) ?? "")
    .join("");

  if (letters !== "") return letters.toUpperCase();

  return user.full_name.trim().charAt(0).toUpperCase() || "—";
}

function formatDate(value: string | null): string {
  if (!value) return "";

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
