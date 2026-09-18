"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import ArticleForm from "@/components/author/ArticleForm";
import { ApiError } from "@/lib/api/client";
import { authorArticles } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { AuthorArticle } from "@/lib/api/types";

/**
 * Edit one of your own articles.
 *
 * The form is shared with the write page. The work here is loading the piece
 * and handling the ways that can fail: someone else's article, a deleted one,
 * or one that has already been published and is therefore out of the author's
 * hands.
 */
export default function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();

  const [article, setArticle] = useState<AuthorArticle | null>(null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState<{ title: string; status: string } | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    authorArticles
      .get(Number(id))
      .then(({ data }) => {
        if (!cancelled) setArticle(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError ? err : new ApiError(0, "Could not reach the server."),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading]);

  if (saved) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h1 className="mt-3 text-xl font-bold text-slate-900">Changes saved</h1>
            <p className="mt-2 text-sm text-slate-600">
              {saved.status === "pending_review"
                ? "Your article has gone back to an editor for review."
                : "Your draft has been updated."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/author/articles"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                My articles
              </Link>
              <button
                type="button"
                onClick={() => setSaved(null)}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Keep editing
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (loadError) {
    /*
     * 403 covers two different things here: an article belonging to another
     * author, and one of your own that has already been published — the
     * policy refuses both. They are told apart only by what the author can
     * usefully do next.
     */
    const notYours = loadError.status === 403 || loadError.status === 404;

    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            {notYours ? "Article not available" : "Could not load this article"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {notYours
              ? "It does not exist, it belongs to another author, or it has already been published — a published article can only be changed by an editor."
              : loadError.detail}
          </p>
          <Link
            href="/author/articles"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to my articles
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link
          href="/author/articles"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my articles
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">Edit Article</h1>
        <p className="mt-1 text-sm text-slate-500">
          Save a draft, or submit it for an editor to review.
        </p>

        {article ? (
          // Keyed by id so switching articles remounts the form, which seeds
          // itself from the prop only on first render.
          <ArticleForm key={article.id} article={article} onSaved={setSaved} />
        ) : (
          <div className="flex items-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading the article…
          </div>
        )}
      </main>
    </>
  );
}
