"use client";

import Link from "next/link";
import { LayoutDashboard, Send } from "lucide-react";
import UserMenu from "@/components/admin/UserMenu";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useHeaderNav } from "@/lib/nav/useHeaderNav";

/**
 * The right-hand side of the public header: Login/Register for guests, the
 * dashboard and user menu for everyone else.
 *
 * Shared by all three headers so the signed-in state can't be right on one
 * page and wrong on the next.
 */
export default function HeaderAuthControls({
  variant = "site",
  onNavigate,
  layout = "row",
}: {
  variant?: "site" | "outlined";
  /** Called after any link is followed — lets a mobile menu close itself. */
  onNavigate?: () => void;
  /** "stack" fills the width, for the mobile drawer. */
  layout?: "row" | "stack";
}) {
  const { loading, isAuthenticated, dashboardHref, canPost, postJobHref } =
    useHeaderNav();
  const { logout } = useAuth();

  /*
   * Render nothing until the session check resolves. Showing "Login" and then
   * swapping it for the user's name a moment later is worse than a brief gap,
   * and it is exactly what made a signed-in user think they were signed out.
   */
  if (loading) return null;

  const stack = layout === "stack";
  const base = stack ? "flex-1 text-center " : "";

  const loginClass =
    variant === "outlined"
      ? "text-sm font-medium text-slate-700 border border-slate-200 rounded-md px-4 py-2 hover:border-blue-400 hover:text-blue-600"
      : "px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600";

  const registerClass =
    variant === "outlined"
      ? "text-sm font-medium text-blue-600 border border-blue-200 rounded-md px-4 py-2 hover:bg-blue-50"
      : "px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50";

  const primaryClass =
    variant === "outlined"
      ? "flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-blue-600 rounded-md px-4 py-2 hover:bg-blue-700"
      : "flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30";

  if (isAuthenticated) {
    return (
      <>
        <Link
          href={dashboardHref}
          onClick={onNavigate}
          className={`${base}${loginClass} flex items-center gap-1.5`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        {canPost && (
          <Link href={postJobHref} onClick={onNavigate} className={`${base}${primaryClass}`}>
            <Send className="h-3.5 w-3.5" />
            Post a Job
          </Link>
        )}

        {/*
          The dropdown carries sign-out on desktop, but it has nowhere to open
          inside a mobile drawer — so the drawer gets its own plain button.
          Either way there is always a way out.
        */}
        {stack ? (
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              void logout();
            }}
            className={`${base}${loginClass}`}
          >
            Sign out
          </button>
        ) : (
          <UserMenu align="right" />
        )}
      </>
    );
  }

  return (
    <>
      <Link href="/login" onClick={onNavigate} className={`${base}${loginClass}`}>
        Login
      </Link>
      <Link href="/register" onClick={onNavigate} className={`${base}${registerClass}`}>
        Register
      </Link>
      <Link href={postJobHref} onClick={onNavigate} className={`${base}${primaryClass}`}>
        <Send className="h-3.5 w-3.5" />
        Post a Job
      </Link>
    </>
  );
}
