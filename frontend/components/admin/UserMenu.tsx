"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * The signed-in user, and the way out.
 *
 * Shared by the topbar and the sidebar so the two can't drift apart — both
 * previously rendered a hardcoded "Super Admin" with no way to sign out.
 */
export default function UserMenu({
  variant = "light",
  align = "right",
  showEmail = false,
}: {
  variant?: "light" | "dark";
  align?: "left" | "right";
  showEmail?: boolean;
}) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dark = variant === "dark";

  // Close on an outside click or Escape, the two ways a user expects to
  // dismiss a menu they opened by accident.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  // Initials from whatever the name actually is, rather than a fixed "SA".
  // full_name can come back blank when neither name part is set, so fall
  // back to the email, which is always present.
  const displayName = user.full_name?.trim() || user.email;

  const initials = displayName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? "")
    .join("");

  const isAdmin = user.roles.includes("administrator");
  const isEmployer = user.roles.includes("employer");
  const settingsHref = isAdmin ? "/admin/settings" : "/employer/company-profile";

  const primaryRole = user.roles[0] ?? "User";
  const roleLabel = primaryRole
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  async function handleLogout() {
    setBusy(true);
    try {
      await logout();
    } finally {
      // logout() navigates away; this only matters if it fails.
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition ${
          dark ? "hover:bg-white/10" : "hover:bg-gray-50"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${
            dark ? "bg-white/10 text-white" : "bg-gray-200 text-gray-600"
          }`}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold">{initials || "?"}</span>
          )}
        </span>

        <span className={`min-w-0 flex-1 leading-tight ${showEmail ? "" : "hidden sm:block"}`}>
          <span
            className={`block truncate text-[13px] font-semibold ${
              dark ? "text-white" : "text-gray-900"
            }`}
          >
            {displayName}
          </span>
          <span
            className={`block truncate text-[12px] ${dark ? "text-slate-300" : "text-gray-500"}`}
          >
            {showEmail ? user.email : roleLabel}
          </span>
        </span>

        <ChevronDown
          size={15}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""} ${
            dark ? "text-slate-300" : "text-gray-400"
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-1 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          } ${
            /* In the sidebar the menu sits at the bottom of the viewport, so
               it opens upward instead of off the screen. */
            align === "left" ? "bottom-full mb-1 mt-0" : "top-full"
          }`}
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-[13px] font-semibold text-gray-900">{displayName}</p>
            <p className="truncate text-[12px] text-gray-500">{user.email}</p>
            <p className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
              {roleLabel}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50"
            >
              <UserIcon size={15} className="text-gray-400" />
              My Profile
            </Link>

            {/* Settings is role-aware: /admin/settings would bounce anyone
                who is not an administrator. */}
            {(isAdmin || isEmployer) && (
              <Link
                href={settingsHref}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50"
              >
                <Settings size={15} className="text-gray-400" />
                {isAdmin ? "Settings" : "Company Profile"}
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={busy}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <LogOut size={15} />
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
