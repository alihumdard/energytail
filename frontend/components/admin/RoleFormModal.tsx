"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { adminRoles } from "@/lib/api/endpoints";
import type { Role } from "@/lib/api/types";

interface Props {
  /** The role being renamed, or null to create one. */
  role: Role | null;
  onClose: () => void;
  onSaved: (role: Role) => void;
  /** Called after a delete, so the screen can select something else. */
  onDeleted: () => void;
}

export default function RoleFormModal({ role, onClose, onSaved, onDeleted }: Props) {
  const editing = role !== null;
  const systemRole = role?.is_system ?? false;

  const [label, setLabel] = useState(role?.label ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const saved = editing
        ? await adminRoles.update(role.id, { label, description })
        : /*
           * Created with no permissions. The matrix behind this dialog is
           * where they get granted, and inventing a starting set here would
           * hand out access nobody asked for.
           */
          await adminRoles.create({ label, description, permissions: [] });

      onSaved(saved.data);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err : new ApiError(0, "Could not reach the server."),
      );
      setSaving(false);
    }
  }

  async function remove() {
    if (!role) return;

    setDeleting(true);
    setError(null);

    try {
      await adminRoles.remove(role.id);
      onDeleted();
      onClose();
    } catch (err) {
      // The API refuses to delete a system role or one that still has users,
      // and the reason is what the administrator needs to see.
      setError(
        err instanceof ApiError ? err : new ApiError(0, "Could not delete this role."),
      );
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  const labelError = error?.fieldError("label");
  const generalError = error && !labelError ? error.detail : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Edit role" : "Add role"}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            {editing ? "Edit Role" : "Add New Role"}
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

          <div>
            <label htmlFor="role-label" className="text-sm font-medium text-slate-700">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              id="role-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              /*
               * System roles keep their seeded names. The label identifies the
               * role everywhere in the UI, and nothing stopped it being set to
               * another role's name — renaming Administrator to "Employer"
               * left two entries reading the same, with no way to tell which
               * one granted full access. The API refuses it too.
               */
              disabled={systemRole}
              placeholder="e.g. Content Moderator"
              className={`mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                systemRole ? "cursor-not-allowed bg-slate-50 text-slate-500" : ""
              }`}
            />
            {labelError ? (
              <p className="mt-1 text-xs text-red-600">{labelError}</p>
            ) : systemRole ? (
              <p className="mt-1 text-xs text-slate-400">
                Built-in roles cannot be renamed. You can still change the
                description below.
              </p>
            ) : (
              editing && (
                <p className="mt-1 text-xs text-slate-400">
                  The internal name stays as{" "}
                  <code className="font-mono">{role.name}</code> — changing it would
                  break permissions already assigned.
                </p>
              )
            )}
          </div>

          <div>
            <label htmlFor="role-description" className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="role-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this role is for"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {!editing && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              The role starts with no permissions. Grant them from the matrix once
              it is created.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
            {/* System roles are seeded and cannot be removed: deleting one
                would leave parts of the app with nobody able to reach them. */}
            {editing && !role.is_system && (
              confirmingDelete ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="mr-auto rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel delete
                  </button>
                  <button
                    type="button"
                    onClick={remove}
                    disabled={deleting}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm delete
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="mr-auto flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || label.trim() === ""}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
