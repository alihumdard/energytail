import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock, Eye } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { DarkFooter } from "@/components/Shared";
import Comments from "@/components/articles/Comments";
import { fetchPublic, ServerFetchError } from "@/lib/api/server";
import JsonLd from "@/lib/seo/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { absoluteUrl } from "@/lib/seo/site";
import { articleThumbnail } from "@/lib/thumbnails";
import ShareButtons from "@/components/articles/ShareButtons";
import ArticleBody from "@/components/articles/ArticleBody";
import type { PublicArticle, TaxonomyItem } from "@/lib/api/types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function loadArticle(slug: string): Promise<PublicArticle | null> {
  try {
    const { data } = await fetchPublic<{ data: PublicArticle }>(
      `/articles/${slug}`,
    );
    return data;
  } catch (error) {
    // A missing or unpublished article is a 404, not a crash — the status
    // travels on the error precisely so this can tell them apart.
    if (error instanceof ServerFetchError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);

  if (!article) return { title: "Article not found" };

  const title = article.meta_title ?? `${article.title}`;
  const description = article.meta_description ?? article.excerpt ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/articles/${article.slug}` },
    // "article" rather than the default, so shares carry the byline and date.
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.published_at ?? undefined,
      authors: article.author ? [article.author.name] : undefined,
    },
  };
}

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  const article = await loadArticle(slug);
  if (!article) notFound();

  const [related, categories] = await Promise.all([
    fetchPublic<{ data: PublicArticle[] }>(`/articles/${slug}/related`).catch(
      () => ({ data: [] as PublicArticle[] }),
    ),
    // The sidebar's topic list. A failure here must not take the article
    // down with it — the piece is still readable without its navigation.
    fetchPublic<{ data: TaxonomyItem[] }>("/taxonomies/article-categories", {
      revalidate: 30,
    }).catch(() => ({ data: [] as TaxonomyItem[] })),
  ]);

  const shareUrl = absoluteUrl(`/articles/${article.slug}`);

  return (
    <>
      <JsonLd data={articleSchema(article)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Articles", path: "/articles" },
          { name: article.title, path: `/articles/${article.slug}` },
        ])}
      />

      <SiteHeader active="Articles" />

      {/*
        A hero, rather than a title floating on white above a loose photo.
        The image is the article's own where one has been uploaded, so on a
        real post this is the piece's lead image with its headline on it —
        which is the shape a reader expects and the old layout only hinted
        at by placing the two near each other.
      */}
      <section className="relative overflow-hidden bg-slate-900">
        <img
          src={articleThumbnail(
            article.featured_image_path,
            article.category?.slug ?? null,
            article.slug,
          )}
          // Empty on purpose: the image is decorative, and the API does not
          // serve the alt text the column stores.
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/*
          The scrim white text needs over an unpredictable photograph,
          weighted to the bottom where the words are. It used to sit at
          80% across the whole frame and left the picture a dark smear;
          this keeps the top of the image legible while still carrying
          the text below it.
        */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/75 to-slate-900/15" />

        {/* Tall enough to read as a photograph. The copy sits at the bottom,
            so the height above it is what the image actually gets. */}
        <div className="relative mx-auto flex min-h-[26rem] max-w-7xl flex-col justify-end px-6 pb-10 pt-8 sm:min-h-[32rem] sm:pb-14 sm:pt-10">
          {/* Pinned to the top of the band rather than riding up against the
              headline, which is where justify-end would otherwise put it. */}
          <Link
            href="/articles"
            className="absolute left-6 top-8 inline-flex items-center gap-1.5 text-sm text-slate-300 transition-colors hover:text-white sm:top-10"
          >
            <ArrowLeft className="h-4 w-4" />
            All articles
          </Link>

          <div className="max-w-3xl">
            {article.category && (
              <Link
                href={`/articles?category=${article.category.slug}`}
                className="inline-block rounded-md bg-blue-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-400"
              >
                {article.category.name}
              </Link>
            )}

            <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mt-3 text-lg leading-relaxed text-slate-300">
                {article.excerpt}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
              {article.author && (
                <span className="font-semibold text-slate-200">
                  {article.author.name}
                </span>
              )}
              <span>{formatDate(article.published_at)}</span>
              {article.reading_minutes && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} /> {article.reading_minutes} min read
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Eye size={13} /> {article.views_count.toLocaleString()} views
              </span>
              {article.is_sponsored && (
                <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-300">
                  Sponsored
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <article className="min-w-0">

          {/*
            The body is Markdown, rendered into React elements rather than
            injected as HTML. The distinction is the point:
            dangerouslySetInnerHTML here would make every author a potential
            XSS vector on a page every visitor reads, so raw HTML in an
            article renders as the characters the author typed.

            Plain text still renders correctly, which is what the seeded
            articles contain — blank-line paragraphs are valid Markdown.
          */}
          <ArticleBody body={article.body ?? ""} />

          {/* At the foot of the piece, where someone who has finished
              reading it decides whether to pass it on. */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <p className="text-sm font-semibold text-slate-700">
              Share this article
            </p>
            <ShareButtons url={shareUrl} title={article.title} />
          </div>

          {/*
            The discussion, below the piece it is about. Client-rendered: it
            changes as readers post, while the article above it is cached.
          */}
          <Comments slug={article.slug} />
          </article>

          {/* Sidebar: where to go next, without leaving the article to
              find it. Sticky below the header, as the job board's is. */}
          {/* Sharing lives at the foot of the article only. Here as well, it
              was the same four buttons twice on one screen. */}
          <aside className="space-y-5 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)]">
            {categories.data.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                  Topics
                </h2>
                <ul className="mt-3 space-y-0.5">
                  {categories.data.map((c) => {
                    const current = c.slug === article.category?.slug;

                    return (
                      <li key={c.slug}>
                        <Link
                          href={`/articles?category=${c.slug}`}
                          aria-current={current ? "true" : undefined}
                          className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                            current
                              ? "bg-blue-50 font-semibold text-blue-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {c.name}
                          {/* The count is the taxonomy's own, so a topic
                              with nothing in it still says so honestly. */}
                          {typeof c.articles_count === "number" && (
                            <span
                              className={`text-xs ${
                                current ? "text-blue-500" : "text-slate-400"
                              }`}
                            >
                              {c.articles_count}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href="/articles"
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600"
                >
                  All articles
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </aside>
        </div>

        {related.data.length > 0 && (
          <section className="border-t border-slate-200 bg-slate-50">
            <div className="mx-auto max-w-7xl px-6 py-12">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Similar Topics
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {article.category
                      ? `More reading on ${article.category.name} and related subjects.`
                      : "More reading from across the site."}
                  </p>
                </div>

                <Link
                  href={
                    article.category
                      ? `/articles?category=${article.category.slug}`
                      : "/articles"
                  }
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600"
                >
                  Browse all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.data.map((a) => (
                  <Link
                    key={a.id}
                    href={`/articles/${a.slug}`}
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={articleThumbnail(
                          a.featured_image_path,
                          a.category?.slug ?? null,
                          a.slug,
                        )}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-4">
                      {a.category && (
                        <span className="text-xs font-semibold text-blue-600">
                          {a.category.name}
                        </span>
                      )}
                      <h3 className="mt-1 font-semibold leading-snug text-slate-900">
                        {a.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(a.published_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <DarkFooter />
    </>
  );
}
