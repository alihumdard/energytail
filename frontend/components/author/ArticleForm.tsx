"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Image as ImageIcon, Loader2, Save, Send, Upload } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { authorArticles, publicApi } from "@/lib/api/endpoints";
import SearchableSelect from "@/components/ui/SearchableSelect";
import MarkdownEditor from "@/components/ui/MarkdownEditor";
import { resolveUpload } from "@/lib/thumbnails";
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
  const [tags, setTags] = useState<TaxonomyItem[]>([]);
  const [chosenTags, setChosenTags] = useState<number[]>(article?.tags ?? []);

  /**
   * The chosen image, and whether an existing one is being cleared.
   *
   * Kept outside `form` because a File is not a string and must not be
   * serialised with the rest of the payload — it decides whether the
   * request goes as JSON or as multipart.
   */
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setObjectUrl(null);
      return;
    }

    // Revoked on cleanup: an object URL holds the file in memory until it
    // is released, and picking several images would leak every one.
    const url = URL.createObjectURL(imageFile);
    setObjectUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

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

    publicApi
      .tags()
      .then(({ data }) => {
        if (!cancelled) setTags(data);
      })
      .catch(() => {
        // Tags are optional too — the form is still usable without them.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * The JSON payload as multipart, for a request carrying a file.
   *
   * Booleans become "1"/"0": a bare "false" is a non-empty string, which
   * Laravel's boolean rule reads as true. Arrays are sent as name[]
   * entries, which is how PHP reconstructs a list — an empty array sends
   * nothing, so tags[] is written explicitly to mean "clear them".
   */
  function toFormData(
    payload: Record<string, unknown>,
    file: File | null,
    clearImage: boolean,
  ): FormData {
    const data = new FormData();

    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null) continue;

      if (typeof value === "boolean") {
        data.append(key, value ? "1" : "0");
      } else if (Array.isArray(value)) {
        // An empty array appends nothing, so the key simply does not
        // arrive. That is why clearing every tag is done through the JSON
        // path, which can express [] — a multipart request that also
        // clears its tags is not a combination the form can produce.
        for (const item of value) data.append(`${key}[]`, String(item));
      } else {
        data.append(key, String(value));
      }
    }

    if (file) data.append("featured_image", file);
    // Only meaningful without a replacement: a new file supersedes it.
    if (clearImage && !file) data.append("remove_featured_image", "1");

    return data;
  }

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

      // Always sent, so clearing every tag is possible — the API leaves
      // tags alone only when the key is absent entirely.
      payload.tags = chosenTags;

      /*
       * A file cannot travel as JSON, so the whole payload becomes
       * multipart the moment one is attached. Everything else still goes as
       * JSON, which keeps the common case — an edit that does not touch the
       * picture — exactly as it was.
       */
      const body =
        imageFile || removeImage
          ? toFormData(payload, imageFile, removeImage)
          : payload;

      const { data } = article
        ? await authorArticles.update(article.id, body)
        : await authorArticles.create(body);

      onSaved({ title: data.title, status: data.status });
    } catch (err) {
      setError(
        err instanceof ApiError ? err : new ApiError(0, "Could not reach the server."),
      );
      setSubmitting(null);
    }
  }

  /*
   * What the preview shows: the newly picked file, or the saved image
   * while none has been picked and none is being removed.
   */
  const imagePreview =
    objectUrl ??
    (!removeImage && article?.featured_image_path
      ? resolveUpload(article.featured_image_path)
      : null);

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

        {/* A div, not a label: a label wrapping this control would forward
            every click inside it — including clicks on an option in the
            open list — back to the button that opens it. */}
        <div className="block">
          <label
            htmlFor="article_category_id"
            className="text-sm font-medium text-slate-700"
          >
            Category
          </label>
          <div className="mt-1">
            <SearchableSelect
              id="article_category_id"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              value={form.article_category_id || null}
              onChange={(next) =>
                set("article_category_id", next === null ? "" : String(next))
              }
              placeholder="Choose a category…"
              invalid={Boolean(fieldError("article_category_id"))}
            />
          </div>
        </div>

        {/*
          The lead image. Optional: a piece without one falls back to a
          photo chosen from its category, which is what every article showed
          before this field existed.
        */}
        <div>
          <span className="text-sm font-medium text-slate-700">
            Feature image
          </span>

          <div className="mt-1.5 flex flex-wrap items-center gap-4">
            {/* A preview, so the choice can be checked before saving — a
                filename alone says nothing about what was picked. */}
            <span className="relative grid h-24 w-40 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {imagePreview ? (
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-slate-400">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-[11px]">No image</span>
                </span>
              )}
            </span>

            <div className="min-w-0 flex-1">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600">
                <Upload className="h-4 w-4" />
                {imagePreview ? "Replace image" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;

                    setImageFile(file);
                    // Choosing a file overrides a pending removal — the two
                    // together would delete the upload just made.
                    if (file) setRemoveImage(false);
                  }}
                />
              </label>

              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    // Only an image already saved needs removing on the
                    // server; an unsaved pick is just discarded.
                    setRemoveImage(Boolean(article?.featured_image_path));
                  }}
                  className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
                >
                  Remove
                </button>
              )}

              <p className="mt-2 text-xs text-slate-400">
                JPG, PNG or WebP, up to 4MB. Shown on the article card and at
                the top of the piece. Leave empty to use a photo from the
                article&apos;s category.
              </p>

              {fieldError("featured_image") && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldError("featured_image")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/*
          Tags as toggles rather than a multi-select. There are nine of
          them and an author picks two or three — a list of buttons shows
          every option and what is chosen at a glance, which a collapsed
          multi-select does neither.
        */}
        {tags.length > 0 && (
          <div>
            <span className="text-sm font-medium text-slate-700">Tags</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {tags.map((tag) => {
                const on = chosenTags.includes(tag.id);

                return (
                  <button
                    key={tag.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setChosenTags((prev) =>
                        on ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                      )
                    }
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      on
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Up to 10. Tags help readers find related pieces.
            </p>
            {fieldError("tags") && (
              <p className="mt-1 text-xs text-red-600">{fieldError("tags")}</p>
            )}
          </div>
        )}

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

        {/* A div, not a label: the editor is a toolbar and a textarea, and
            a label wrapping both would forward every toolbar click into the
            text area. */}
        <div className="block">
          <label htmlFor="body" className="text-sm font-medium text-slate-700">
            Body <span className="text-red-500">*</span>
          </label>

          {/*
            Markdown, not HTML. The editor gives an author the toolbar they
            expect, while what is stored stays inert text — a WYSIWYG
            editor's HTML would have to be rendered to every visitor, which
            is exactly what the public page has always refused to do.
          */}
          <div className="mt-1">
            <MarkdownEditor
              id="body"
              value={form.body}
              onChange={(v) => set("body", v)}
              placeholder="Write the article. Leave a blank line between paragraphs."
              invalid={Boolean(fieldError("body"))}
            />
          </div>

          <span className="mt-1 flex justify-between text-xs text-slate-400">
            <span>At least 100 characters.</span>
            <span>{words} words</span>
          </span>
          {fieldError("body") && (
            <span className="mt-1 block text-xs text-red-600">{fieldError("body")}</span>
          )}
        </div>
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
