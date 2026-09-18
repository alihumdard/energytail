"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save, Send } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { authorArticles, publicApi } from "@/lib/api/endpoints";
import type { AuthorArticle, TaxonomyItem } from "@/lib/api/types";

/**
 * The article form, shared by writing and editing.
 *
 * One component rather than two near-identical pages: the fields and their
 * rules are the same either way, and a rule fixed on one screen but not the
 * other produces validation errors the form never showed — the same reason
 * the job form is shared.
 */
export default function ArticleForm({
  article,
  onSaved,
}: {
  /** The article being edited; omitted when writing a new one. */
  article?: AuthorArticle;
  onSaved: (result: { title: string; status: string }) => void;
}) {
  const [form, setForm] = useState(() => ({
    title: article?.title ?? "",
    excerpt: article?.excerpt ?? "",
    body: article?.body ?? "",
    article_category_id: article?.article_category_id
      ? String(article.article_category_id)
      : "",
    meta_title: article?.meta_title ?? "",
    meta_description: article?.meta_description ?? "",
  }));

  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [submitting, setSubmitting] = useState<"draft" | "review" | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    let cancelled = false;

    publicApi
      .articleCategories()
      .then(({ data }) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        // The select stays empty; the category is optional anyway.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: FormEvent, status: "draft" | "pending_review") {
    event.preventDefault();
    setSubmitting(status === "draft" ? "draft" : "review");
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        body: form.body,
        status,
      };

      // Blank optionals are omitted rather than sent as "", which the API's
      // nullable-but-typed rules reject.
      for (const key of [
        "excerpt",
        "meta_title",
        "meta_description",
      ] as const) {
        if (form[key] !== "") payload[key] = form[key];
      }

      if (form.article_category_id !== "") {
        payload.article_category_id = Number(form.article_category_id);
      }

      const { data } = article
        ? await authorArticles.update(article.id, payload)
        : await authorArticles.create(payload);

      onSaved({ title: data.title, status: data.status });
    } catch (err) {
      setError(
        err instanceof ApiError ? err : new ApiError(0, "Could not reach the server."),
      );
      setSubmitting(null);
    }
  }

  const fieldError = (name: string) => error?.fieldError(name);

  // Anything the API reports against a field this form does not show has to
  // reach the banner, or saving fails with nothing on screen to explain it.
  const SHOWN = ["title", "body", "excerpt", "article_category_id", "meta_title", "meta_description"];
  const hasInline = SHOWN.some((f) => fieldError(f));
  const generalError = error && !hasInline ? error.detail : null;

  const words = form.body.trim() === "" ? 0 : form.body.trim().split(/\s+/).length;

  return (
    <form onSubmit={(e) => submit(e, "pending_review")} className="mt-6 space-y-6" noValidate>
      {generalError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {generalError}
        </div>
      )}

      {/* The editor's note, where the author is about to act on it. */}
      {article?.status === "rejected" && article.review_notes && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">An editor asked for changes</p>
          <p className="mt-1 text-sm text-amber-800">{article.review_notes}</p>
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
        <h2 className="font-semibold text-slate-900">The article</h2>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Title <span className="text-red-500">*</span>
          </span>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. What LNG demand means for engineers in 2027"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
          />
          {fieldError("title") && (
            <span className="mt-1 block text-xs text-red-600">{fieldError("title")}</span>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <select
            value={form.article_category_id}
            onChange={(e) => set("article_category_id", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="">Choose a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Excerpt</span>
          <textarea
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={2}
            placeholder="One or two sentences for the article card."
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
          />
          {fieldError("excerpt") && (
            <span className="mt-1 block text-xs text-red-600">{fieldError("excerpt")}</span>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Body <span className="text-red-500">*</span>
          </span>
          <textarea
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            rows={16}
            placeholder="Write the article. Leave a blank line between paragraphs."
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-relaxed focus:border-blue-400 focus:outline-none"
          />
          <span className="mt-1 flex justify-between text-xs text-slate-400">
            <span>
              {/* Plain text, not HTML: the public page renders paragraphs as
                  text, so nothing an author writes can execute on a reader's
                  screen. */}
              Blank line between paragraphs. At least 100 characters.
            </span>
            <span>{words} words</span>
          </span>
          {fieldError("body") && (
            <span className="mt-1 block text-xs text-red-600">{fieldError("body")}</span>
          )}
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Search listing</h2>
        <p className="-mt-2 text-xs text-slate-400">
          Optional. Leave blank to use the title and excerpt.
        </p>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Meta title</span>
          <input
            value={form.meta_title}
            onChange={(e) => set("meta_title", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Meta description</span>
          <textarea
            value={form.meta_description}
            onChange={(e) => set("meta_description", e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
          />
        </label>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={(e) => submit(e, "draft")}
          disabled={submitting !== null}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          {submitting === "draft" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save draft
        </button>

        <button
          type="submit"
          disabled={submitting !== null}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting === "review" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit for review
        </button>
      </div>
    </form>
  );
}
