"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import ArticleForm from "@/components/author/ArticleForm";
import RoleShell from "@/components/RoleShell";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function WriteArticlePage() {
  const { user, loading: authLoading } = useAuth();
  const [done, setDone] = useState<{ title: string; status: string } | null>(null);

  // Bumped by "Write another" so the form remounts; it seeds its state once,
  // so without a new key the next article would open pre-filled.
  const [formKey, setFormKey] = useState(0);

  if (!authLoading && user && !user.roles.includes("author") && !user.roles.includes("administrator")) {
    return (
      <RoleShell role="author">
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-slate-900">Authors only</h1>
          <p className="mt-2 text-slate-500">
            Writing an article needs an author account.
          </p>
        </main>
      </RoleShell>
    );
  }

  if (done) {
    const message =
      done.status === "published"
        ? "It is live on the site now."
        : done.status === "pending_review"
          ? "An editor will review it and either publish it or send it back with notes."
          : "It has been saved as a draft — submit it when you are ready.";

    return (
      <RoleShell role="author">
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h1 className="mt-3 text-xl font-bold text-slate-900">
              &ldquo;{done.title}&rdquo; saved
            </h1>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/author/articles"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                My articles
              </Link>
              <button
                type="button"
                onClick={() => {
                  setFormKey((n) => n + 1);
                  setDone(null);
                }}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Write another
              </button>
            </div>
          </div>
        </main>
      </RoleShell>
    );
  }

  return (
    <RoleShell role="author">

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link
          href="/author/articles"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my articles
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">Write an Article</h1>
        <p className="mt-1 text-sm text-slate-500">
          An editor reviews every article before it goes live.
        </p>

        <ArticleForm key={formKey} onSaved={setDone} />
      </main>
    </RoleShell>
  );
}
